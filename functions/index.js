const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const crypto = require("node:crypto");

initializeApp();
setGlobalOptions({ region: "europe-west1", maxInstances: 10 });
const db = getFirestore();
const CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const hashCode = code => crypto.createHash("sha256").update(String(code)).digest("hex");
const requireAuth = request => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Connectez-vous à Bilocost.");
  return request.auth.uid;
};
const requireAdmin = request => {
  const uid = requireAuth(request);
  if (request.auth.token.admin !== true) throw new HttpsError("permission-denied", "Action réservée à l’administration Bilocost.");
  return uid;
};

exports.createDeliveryOrder = onCall(async request => {
  const uid = requireAuth(request);
  const { itemId, chatId, receive = "pickup" } = request.data || {};
  if (typeof itemId !== "string" || typeof chatId !== "string" || !["pickup", "delivery"].includes(receive)) {
    throw new HttpsError("invalid-argument", "Données de commande invalides.");
  }
  const itemRef = db.collection("items").doc(itemId), chatRef = db.collection("chats").doc(chatId);
  const [itemSnap, chatSnap] = await Promise.all([itemRef.get(), chatRef.get()]);
  if (!itemSnap.exists || !chatSnap.exists) throw new HttpsError("not-found", "Article ou conversation introuvable.");
  const item = itemSnap.data(), chat = chatSnap.data();
  if (item.status !== "active" || !item.sellerId || item.sellerId === uid) {
    throw new HttpsError("failed-precondition", "Cet article n’est pas disponible à la commande.");
  }
  if (chat.buyerId !== uid || chat.sellerId !== item.sellerId ||
      !Array.isArray(chat.participants) || !chat.participants.includes(uid) || !chat.participants.includes(item.sellerId)) {
    throw new HttpsError("permission-denied", "Vous ne pouvez pas commander cet article depuis cette conversation.");
  }
  const priceCDF = Number(item.priceCDF);
  if (!Number.isSafeInteger(priceCDF) || priceCDF <= 0) throw new HttpsError("failed-precondition", "Prix de l’article invalide.");
  const delivery = item.delivery || { mode: "pickup", fee: 0 };
  if (receive === "delivery" && !["delivery", "both"].includes(delivery.mode)) {
    throw new HttpsError("failed-precondition", "La livraison n’est pas proposée pour cet article.");
  }
  const deliveryFeeCDF = receive === "delivery" ? Math.max(0, Math.round(Number(delivery.fee) || 0)) : 0;
  const orderRef = db.collection("orders").doc();
  await orderRef.create({
    buyerId: uid, buyerName: String(chat.buyerName || "").slice(0, 100),
    sellerId: item.sellerId, sellerName: String(item.sellerName || chat.sellerName || "").slice(0, 100),
    itemId, itemTitle: String(item.title || "Article Bilocost").slice(0, 120), chatId, receive,
    priceCDF, deliveryFeeCDF, totalCDF: priceCDF + deliveryFeeCDF,
    paymentStatus: "NOT_CONFIGURED", escrowStatus: "NOT_ACTIVE", status: "AWAITING_PAYMENT",
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
  });
  return { orderId: orderRef.id, status: "AWAITING_PAYMENT", totalCDF: priceCDF + deliveryFeeCDF };
});

/* Invoke only after a payment provider has verifiably confirmed payment.
   Until a provider webhook exists, this is restricted to trusted admin claims. */
exports.confirmOrderPayment = onCall(async request => {
  requireAdmin(request);
  const { orderId } = request.data || {};
  if (typeof orderId !== "string" || !orderId) throw new HttpsError("invalid-argument", "Commande invalide.");
  const orderRef = db.collection("orders").doc(orderId), code = String(crypto.randomInt(100000, 1000000));
  const expiresAt = Timestamp.fromMillis(Date.now() + CODE_TTL_MS);
  await db.runTransaction(async tx => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) throw new HttpsError("not-found", "Commande introuvable.");
    const order = snap.data();
    if (order.status !== "AWAITING_PAYMENT" || order.paymentStatus !== "NOT_CONFIGURED") {
      throw new HttpsError("failed-precondition", "La commande n’attend pas une confirmation de paiement.");
    }
    tx.update(orderRef, { paymentStatus: "CONFIRMED", escrowStatus: "NOT_ACTIVE", status: "READY_FOR_DELIVERY",
      deliveryCodeHash: hashCode(code), deliveryCodeExpiresAt: expiresAt, deliveryCodeAttempts: 0, updatedAt: FieldValue.serverTimestamp() });
    tx.set(db.collection("deliveryCodes").doc(orderId), {
      ownerId: order.buyerId, code, expiresAt, createdAt: FieldValue.serverTimestamp(), usedAt: null
    });
  });
  return { status: "READY_FOR_DELIVERY", expiresAt: expiresAt.toDate().toISOString() };
});

exports.confirmDelivery = onCall(async request => {
  const uid = requireAuth(request), { orderId, code } = request.data || {};
  if (typeof orderId !== "string" || !/^\d{6}$/.test(String(code || ""))) {
    throw new HttpsError("invalid-argument", "Saisissez un code à 6 chiffres.");
  }
  const orderRef = db.collection("orders").doc(orderId), secretRef = db.collection("deliveryCodes").doc(orderId);
  const result = await db.runTransaction(async tx => {
    const [orderSnap, secretSnap] = await Promise.all([tx.get(orderRef), tx.get(secretRef)]);
    if (!orderSnap.exists || !secretSnap.exists) throw new HttpsError("not-found", "Code ou commande introuvable.");
    const order = orderSnap.data(), secret = secretSnap.data();
    if (order.sellerId !== uid) throw new HttpsError("permission-denied", "Seul le vendeur de cette commande peut confirmer la remise.");
    if (order.status !== "READY_FOR_DELIVERY" || secret.usedAt) throw new HttpsError("failed-precondition", "Cette commande ne peut plus être confirmée.");
    if (!secret.expiresAt || secret.expiresAt.toMillis() < Date.now()) throw new HttpsError("deadline-exceeded", "Le code de remise a expiré.");
    const attempts = Number(order.deliveryCodeAttempts || 0);
    if (attempts >= MAX_ATTEMPTS) throw new HttpsError("resource-exhausted", "Nombre maximal d’essais atteint.");
    const expected = Buffer.from(String(order.deliveryCodeHash || ""), "hex"), actual = Buffer.from(hashCode(code), "hex");
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      tx.update(orderRef, { deliveryCodeAttempts: attempts + 1, updatedAt: FieldValue.serverTimestamp() });
      return { ok: false, attemptsLeft: MAX_ATTEMPTS - attempts - 1 };
    }
    tx.update(orderRef, { status: "DELIVERED", deliveredAt: FieldValue.serverTimestamp(), deliveryConfirmedBy: uid,
      deliveryCodeUsedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    tx.update(secretRef, { usedAt: FieldValue.serverTimestamp(), code: FieldValue.delete() });
    return { ok: true };
  });
  if (!result.ok) throw new HttpsError("permission-denied", "Code incorrect. " + result.attemptsLeft + " essai(s) restant(s).");
  return { status: "DELIVERED" };
});
