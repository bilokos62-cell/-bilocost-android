const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp, FieldPath } = require("firebase-admin/firestore");
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
const notifyInbox = (uid, payload) => db.collection("inboxNotifications").add({
  ownerId: uid, type: payload.type, title: String(payload.title || "Bilocost").slice(0, 100),
  body: String(payload.body || "").slice(0, 400), read: false,
  ...(payload.orderId ? { orderId: payload.orderId } : {}),
  ...(payload.side ? { side: payload.side } : {}),
  ...(payload.code ? { code: payload.code } : {}),
  createdAt: FieldValue.serverTimestamp()
});
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
  await Promise.all([
    notifyInbox(uid, { type: "order_created", title: "Commande enregistrée", body: "Votre commande est créée. Le paiement n’est pas encore activé.", orderId: orderRef.id, side: "buy" }),
    notifyInbox(item.sellerId, { type: "order_created", title: "Nouvelle commande", body: "Un acheteur vient d’enregistrer une commande pour votre article.", orderId: orderRef.id, side: "sell" })
  ]);
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
  const inboxRef = db.collection("inboxNotifications").doc();
  await db.runTransaction(async tx => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) throw new HttpsError("not-found", "Commande introuvable.");
    const order = snap.data();
    if (order.status !== "AWAITING_PAYMENT" || order.paymentStatus !== "NOT_CONFIGURED") {
      throw new HttpsError("failed-precondition", "La commande n’attend pas une confirmation de paiement.");
    }
    tx.update(orderRef, { paymentStatus: "CONFIRMED", escrowStatus: "NOT_ACTIVE", status: "READY_FOR_DELIVERY",
      deliveryCodeHash: hashCode(code), deliveryCodeExpiresAt: expiresAt, deliveryCodeAttempts: 0, deliveryNotificationId: inboxRef.id, updatedAt: FieldValue.serverTimestamp() });
    tx.create(inboxRef, { ownerId: order.buyerId, type: "delivery_code", title: "Votre code de remise est prêt",
      body: "Paiement confirmé. Présentez ce code au vendeur uniquement après avoir reçu et vérifié l’article.",
      code, orderId, side: "buy", read: false, createdAt: FieldValue.serverTimestamp() });
    const sellerNotice = db.collection("inboxNotifications").doc();
    tx.create(sellerNotice, { ownerId: order.sellerId, type: "order_paid", title: "Paiement confirmé",
      body: "Le paiement de cette commande a été confirmé. Vous pouvez organiser la remise de l’article.",
      orderId, side: "sell", read: false, createdAt: FieldValue.serverTimestamp() });
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
    if (order.deliveryNotificationId) {
      tx.update(db.collection("inboxNotifications").doc(order.deliveryNotificationId), {
        code: FieldValue.delete(), read: true, usedAt: FieldValue.serverTimestamp()
      });
    }
    const buyerNotice = db.collection("inboxNotifications").doc();
    tx.create(buyerNotice, { ownerId: order.buyerId, type: "order_delivered", title: "Livraison confirmée",
      body: "La remise de votre article a été confirmée. Conservez votre preuve de commande.",
      orderId, side: "buy", read: false, createdAt: FieldValue.serverTimestamp() });
    const sellerNotice = db.collection("inboxNotifications").doc();
    tx.create(sellerNotice, { ownerId: order.sellerId, type: "order_delivered", title: "Vente terminée",
      body: "La remise de l’article a été confirmée avec le code à usage unique.",
      orderId, side: "sell", read: false, createdAt: FieldValue.serverTimestamp() });
    return { ok: true };
  });
  if (!result.ok) throw new HttpsError("permission-denied", "Code incorrect. " + result.attemptsLeft + " essai(s) restant(s).");
  return { status: "DELIVERED" };
});


/* User-scoped inbox actions. Clients never write notification documents directly. */
exports.markInboxNotificationRead = onCall(async request => {
  const uid = requireAuth(request), { notificationId } = request.data || {};
  if (typeof notificationId !== "string" || !notificationId) throw new HttpsError("invalid-argument", "Notification invalide.");
  const ref = db.collection("inboxNotifications").doc(notificationId);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "Notification introuvable.");
    if (snap.data().ownerId !== uid) throw new HttpsError("permission-denied", "Cette notification ne vous appartient pas.");
    tx.update(ref, { read: true, readAt: FieldValue.serverTimestamp() });
  });
  return { ok: true };
});

exports.broadcastBilocostPromotion = onCall(async request => {
  requireAdmin(request);
  const { title, body } = request.data || {};
  if (typeof title !== "string" || !title.trim() || title.length > 100 ||
      typeof body !== "string" || !body.trim() || body.length > 400) {
    throw new HttpsError("invalid-argument", "Le titre (100 caractères) et le message (400 caractères) sont obligatoires.");
  }
  const usersRef = db.collection("users");
  let cursor = null, count = 0;
  while (true) {
    let query = usersRef.orderBy(FieldPath.documentId()).limit(400);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.select().get();
    if (page.empty) break;
    let batch = db.batch(), pending = 0;
    for (const user of page.docs) {
      const ref = db.collection("inboxNotifications").doc();
      batch.create(ref, { ownerId: user.id, type: "promotion", title: title.trim(), body: body.trim(), read: false, createdAt: FieldValue.serverTimestamp() });
      count++; pending++;
      if (pending === 400) { await batch.commit(); batch = db.batch(); pending = 0; }
    }
    if (pending) await batch.commit();
    cursor = page.docs[page.docs.length - 1];
    if (page.size < 400) break;
  }
  return { sent: count };
});


/* Notify the other participant when a new chat message is created. */
exports.notifyChatMessage = onDocumentCreated("chats/{chatId}/messages/{messageId}", async event => {
  const message = event.data && event.data.data();
  if (!message || typeof message.from !== "string") return;
  const chatSnap = await db.collection("chats").doc(event.params.chatId).get();
  if (!chatSnap.exists) return;
  const chat = chatSnap.data();
  const recipientIds = (Array.isArray(chat.participants) ? chat.participants : [])
    .filter(uid => typeof uid === "string" && uid !== message.from);
  const preview = typeof message.text === "string" && message.text.trim()
    ? message.text.trim().slice(0, 180) : "Vous avez reçu un nouveau message.";
  for (const uid of recipientIds) {
    const ref = db.collection("inboxNotifications").doc(event.params.messageId + "_" + uid);
    try {
      await ref.create({ ownerId: uid, type: "chat_message", title: "Nouveau message",
        body: preview, chatId: event.params.chatId, read: false,
        createdAt: FieldValue.serverTimestamp() });
    } catch (error) {
      if (error.code !== 6 && error.code !== "already-exists") throw error;
    }
  }
});


/* Automatic official USD/CDF reference rate from the Banque Centrale du Congo.
   The BCC publishes daily official buy, mean and sell quotes. We store the
   publication date separately from fetch time and never synthesize a rate. */
const BCC_RATE_URL = "https://www.bcc.cd/marche-des-changes/cours-de-change";
const parseBccNumber = value => {
  const normalized = String(value || "")
    .replace(/[\\u00a0\\u202f\\s]/g, "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");
  const result = Number(normalized);
  return Number.isFinite(result) && result > 0 ? result : null;
};
const htmlText = value => String(value || "")
  .replace(/<script[\\s\\S]*?<\\/script>/gi, " ")
  .replace(/<style[\\s\\S]*?<\\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;|&#8239;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/\\s+/g, " ")
  .trim();
const parseBccUsdRate = html => {
  const rows = String(html).match(/<tr\\b[\\s\\S]*?<\\/tr>/gi) || [];
  let usd = null;
  for (const row of rows) {
    const cells = [...row.matchAll(/<t[dh]\\b[^>]*>([\\s\\S]*?)<\\/t[dh]>/gi)]
      .map(match => htmlText(match[1]));
    if (cells.length >= 5 && /^USD$/i.test(cells[0])) {
      usd = {
        mean: parseBccNumber(cells[2]),
        buy: parseBccNumber(cells[3]),
        sell: parseBccNumber(cells[4])
      };
      break;
    }
  }
  if (!usd || !usd.mean || !usd.buy || !usd.sell) {
    throw new Error("La ligne USD officielle est absente ou invalide sur la page BCC.");
  }
  const text = htmlText(html);
  const dateMatch = text.match(/March[eé] officiel des changes\\s+(\\d{2})\\/(\\d{2})\\/(\\d{4})/i);
  if (!dateMatch) throw new Error("Date de publication BCC introuvable : aucune cotation ne sera publiée.");
  const publicationDate = dateMatch[3] + "-" + dateMatch[2] + "-" + dateMatch[1];
  return { ...usd, publicationDate };
};
const syncOfficialExchangeRate = async () => {
  const response = await fetch(BCC_RATE_URL, {
    headers: { "User-Agent": "BilocostExchangeRateBot/1.0 (official BCC quote sync)" },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error("BCC HTTP " + response.status);
  const html = await response.text();
  const rate = parseBccUsdRate(html);
  // Guard against malformed page content and implausible values.
  if (rate.mean < 500 || rate.mean > 10000 || rate.buy < 500 || rate.sell > 10000 ||
      rate.buy > rate.sell || rate.mean < rate.buy || rate.mean > rate.sell) {
    throw new Error("La cotation USD/CDF reçue ne passe pas les contrôles de cohérence.");
  }
  const currentRef = db.collection("exchange_rates").doc("current");
  const historyRef = db.collection("exchange_rate_history").doc(rate.publicationDate);
  const now = FieldValue.serverTimestamp();
  const result = await db.runTransaction(async tx => {
    const [currentSnap, historySnap] = await Promise.all([tx.get(currentRef), tx.get(historyRef)]);
    const previous = currentSnap.exists ? currentSnap.data() : {};
    const changed = !currentSnap.exists || previous.publicationDate !== rate.publicationDate ||
      previous.mean !== rate.mean || previous.buy !== rate.buy || previous.sell !== rate.sell;
    const record = {
      base: "USD", quote: "CDF",
      mean: rate.mean, buy: rate.buy, sell: rate.sell,
      source: "BCC", sourceUrl: BCC_RATE_URL,
      publicationDate: rate.publicationDate,
      fetchedAt: now,
      status: "official"
    };
    tx.set(currentRef, record, { merge: true });
    if (!historySnap.exists || changed) tx.set(historyRef, record, { merge: true });
    return { changed, publicationDate: rate.publicationDate, mean: rate.mean, buy: rate.buy, sell: rate.sell };
  });
  console.log("Bilocost BCC USD/CDF sync:", JSON.stringify(result));
  return result;
};

exports.syncBccExchangeRate = onSchedule({
  schedule: "0 10,14 * * 1-5",
  timeZone: "Africa/Kinshasa",
  timeoutSeconds: 60,
  memory: "256MiB"
}, async () => {
  await syncOfficialExchangeRate();
});

exports.refreshBccExchangeRate = onCall(async request => {
  requireAdmin(request);
  return await syncOfficialExchangeRate();
});
