"use strict";

const admin = require("firebase-admin");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const {defineSecret} = require("firebase-functions/params");
const {createHmac, randomInt, timingSafeEqual} = require("node:crypto");

admin.initializeApp();
setGlobalOptions({region: "us-central1", maxInstances: 10});

const db = admin.firestore();
const deliveryCodePepper = defineSecret("DELIVERY_CODE_PEPPER");
const ACTIVE_ORDER_STATES = new Set(["PAYMENT_CONFIRMED", "PREPARING", "SHIPPED"]);
const CODE_TTL_MS = 45 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function requireUser(request) {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Connectez-vous à votre compte Bilocost.");
  }
  return request.auth.uid;
}

function requireOrderId(value) {
  const id = typeof value === "string" ? value.trim() : "";
  if (!id || id.length > 128 || id.includes("/")) {
    throw new HttpsError("invalid-argument", "Identifiant de commande invalide.");
  }
  return id;
}

function timestampMillis(value) {
  return value && typeof value.toMillis === "function" ? value.toMillis() : 0;
}

function codeDigest(orderId, code) {
  const pepper = deliveryCodePepper.value();
  if (!pepper || pepper.length < 32) {
    throw new HttpsError("failed-precondition", "Le secret serveur du code de remise n'est pas configuré.");
  }
  return createHmac("sha256", pepper).update(orderId + ":" + code).digest("hex");
}

function safeDigestEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== 64 || right.length !== 64) {
    return false;
  }
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function orderRefs(orderId, buyerId) {
  return {
    order: db.collection("secureOrders").doc(orderId),
    secret: db.collection("deliverySecrets").doc(orderId),
    buyerCodeMessage: db.collection("userInbox").doc(buyerId).collection("messages").doc(orderId + "_delivery_code")
  };
}

/**
 * Called only by the authenticated buyer after a provider-confirmed payment.
 * The plaintext code is kept only in the buyer's private in-app inbox.
 * The order itself contains no OTP hash or plaintext code.
 */
exports.getBuyerDeliveryCode = onCall({secrets: [deliveryCodePepper]}, async (request) => {
  const uid = requireUser(request);
  const orderId = requireOrderId(request.data && request.data.orderId);
  const refs = orderRefs(orderId, uid);
  const now = Date.now();

  const result = await db.runTransaction(async (tx) => {
    const snapshots = await Promise.all([
      tx.get(refs.order),
      tx.get(refs.secret),
      tx.get(refs.buyerCodeMessage)
    ]);
    const orderSnap = snapshots[0];
    const secretSnap = snapshots[1];
    const messageSnap = snapshots[2];

    if (!orderSnap.exists) throw new HttpsError("not-found", "Commande introuvable.");
    const order = orderSnap.data();
    if (order.buyerId !== uid) throw new HttpsError("permission-denied", "Cette commande n'appartient pas à votre compte.");
    if (!ACTIVE_ORDER_STATES.has(order.status)) {
      throw new HttpsError("failed-precondition", "Le code sera disponible après confirmation réelle du paiement.");
    }

    const secret = secretSnap.exists ? secretSnap.data() : {};
    const message = messageSnap.exists ? messageSnap.data() : {};
    const expiresAt = timestampMillis(secret.expiresAt);
    const lockedUntil = timestampMillis(secret.lockedUntil);

    if (lockedUntil > now) {
      throw new HttpsError("resource-exhausted", "Trop de tentatives. Réessayez après la période de sécurité.");
    }

    if (
      secret.codeHash &&
      expiresAt > now &&
      Number(secret.attempts || 0) < MAX_ATTEMPTS &&
      typeof message.code === "string"
    ) {
      return {code: message.code, expiresAt};
    }

    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    const nextExpiry = now + CODE_TTL_MS;
    const expiryTimestamp = admin.firestore.Timestamp.fromMillis(nextExpiry);

    tx.set(refs.secret, {
      orderId,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      codeHash: codeDigest(orderId, code),
      expiresAt: expiryTimestamp,
      attempts: 0,
      lockedUntil: null,
      issuedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    tx.set(refs.buyerCodeMessage, {
      type: "DELIVERY_CODE",
      orderId,
      title: "Votre code de remise Bilocost",
      body: "Présentez ce code au vendeur uniquement lorsque vous avez reçu et vérifié l'article.",
      code,
      expiresAt: expiryTimestamp,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });

    return {code, expiresAt: nextExpiry};
  });

  return {
    code: result.code,
    expiresAt: new Date(result.expiresAt).toISOString(),
    channel: "BILOCOSt_IN_APP_INBOX"
  };
});

/**
 * Called by the seller at the physical handover.
 * A successful code confirms delivery only; it never releases escrow funds.
 */
exports.confirmDeliveryCode = onCall({secrets: [deliveryCodePepper]}, async (request) => {
  const uid = requireUser(request);
  const orderId = requireOrderId(request.data && request.data.orderId);
  const code = typeof (request.data && request.data.code) === "string"
    ? request.data.code.trim()
    : "";

  if (!/^\d{6}$/.test(code)) {
    throw new HttpsError("invalid-argument", "Saisissez les 6 chiffres du code.");
  }

  const orderRef = db.collection("secureOrders").doc(orderId);
  const secretRef = db.collection("deliverySecrets").doc(orderId);
  const now = Date.now();

  const result = await db.runTransaction(async (tx) => {
    const snapshots = await Promise.all([tx.get(orderRef), tx.get(secretRef)]);
    const orderSnap = snapshots[0];
    const secretSnap = snapshots[1];

    if (!orderSnap.exists) throw new HttpsError("not-found", "Commande introuvable.");
    const order = orderSnap.data();

    if (order.sellerId !== uid) {
      throw new HttpsError("permission-denied", "Seul le vendeur associé à cette commande peut confirmer la remise.");
    }
    if (order.status === "DELIVERED") return {ok: true, already: true};
    if (!ACTIVE_ORDER_STATES.has(order.status)) {
      throw new HttpsError("failed-precondition", "Cette commande ne peut pas encore être confirmée.");
    }
    if (!secretSnap.exists) {
      throw new HttpsError("failed-precondition", "Le code doit d'abord être demandé par l'acheteur.");
    }

    const secret = secretSnap.data();
    const expiresAt = timestampMillis(secret.expiresAt);
    const lockedUntil = timestampMillis(secret.lockedUntil);
    const attempts = Number(secret.attempts || 0);

    if (lockedUntil > now || attempts >= MAX_ATTEMPTS) {
      throw new HttpsError("resource-exhausted", "Code temporairement bloqué après cinq essais. Demandez un nouveau code après le délai de sécurité.");
    }
    if (expiresAt <= now) {
      throw new HttpsError("deadline-exceeded", "Code expiré. L'acheteur doit en demander un nouveau.");
    }

    const expected = codeDigest(orderId, code);
    if (!safeDigestEqual(secret.codeHash, expected)) {
      const nextAttempts = attempts + 1;
      const patch = {
        attempts: nextAttempts,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      if (nextAttempts >= MAX_ATTEMPTS) {
        patch.lockedUntil = admin.firestore.Timestamp.fromMillis(now + LOCK_MS);
      }
      tx.update(secretRef, patch);
      return {ok: false, attemptsRemaining: Math.max(0, MAX_ATTEMPTS - nextAttempts)};
    }

    const buyerId = order.buyerId;
    const buyerMessageRef = db.collection("userInbox").doc(buyerId).collection("messages").doc(orderId + "_delivery_code");
    const buyerDoneRef = db.collection("userInbox").doc(buyerId).collection("messages").doc(orderId + "_delivery_confirmed");
    const sellerDoneRef = db.collection("userInbox").doc(uid).collection("messages").doc(orderId + "_delivery_confirmed");

    tx.update(orderRef, {
      status: "DELIVERED",
      deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
      deliveryConfirmedBy: uid,
      deliveryConfirmationMethod: "BUYER_OTP",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    tx.delete(secretRef);
    tx.set(buyerMessageRef, {
      type: "DELIVERY_CODE_USED",
      orderId,
      title: "Code de remise utilisé",
      body: "La remise a été confirmée. La confirmation de réception ne déclenche pas à elle seule un versement au vendeur.",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    tx.set(buyerDoneRef, {
      type: "DELIVERY_CONFIRMED",
      orderId,
      title: "Réception confirmée",
      body: "La remise de votre commande a été confirmée avec le code Bilocost.",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    tx.set(sellerDoneRef, {
      type: "DELIVERY_CONFIRMED",
      orderId,
      title: "Remise confirmée",
      body: "Le code fourni par l'acheteur est valide. La commande est marquée comme livrée.",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    tx.create(orderRef.collection("auditLogs").doc(), {
      event: "DELIVERY_CONFIRMED",
      actorUid: uid,
      method: "BUYER_OTP",
      at: admin.firestore.FieldValue.serverTimestamp()
    });

    return {ok: true, already: false};
  });

  if (!result.ok) {
    return {
      ok: false,
      attemptsRemaining: result.attemptsRemaining,
      message: result.attemptsRemaining === 0
        ? "Cinq essais atteints. Le code est bloqué pendant 15 minutes."
        : "Code incorrect. Il vous reste " + result.attemptsRemaining + " essai(s)."
    };
  }

  return {
    ok: true,
    already: !!result.already,
    status: "DELIVERED",
    fundsReleased: false,
    message: result.already
      ? "Cette commande est déjà marquée comme livrée."
      : "Livraison confirmée. Aucun versement automatique n'a été déclenché."
  };
});
