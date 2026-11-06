/* Bilocost secure delivery confirmation module, injected after the main app code. */
const BILO_DELIVERY_REGION = "europe-west1";
let BILO_DELIVERY_CALL = null;
async function biloDeliveryCall(name, data) {
  if (!CLOUD || !S.user || !FB.auth || !FB.F) throw new Error("Connectez-vous à Bilocost pour continuer.");
  if (!BILO_DELIVERY_CALL) {
    const mod = await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js");
    const funcs = mod.getFunctions(FB.auth.app, BILO_DELIVERY_REGION);
    BILO_DELIVERY_CALL = name => mod.httpsCallable(funcs, name);
  }
  const result = await BILO_DELIVERY_CALL(name)(data || {});
  return result.data || {};
}
function biloOrderStatus(status) {
  return ({ AWAITING_PAYMENT: "En attente de paiement", READY_FOR_DELIVERY: "Paiement confirmé — remise à effectuer", DELIVERED: "Livraison confirmée", DISPUTED: "Commande contestée", CANCELLED: "Commande annulée" })[status] || status || "Statut indisponible";
}
function biloOrderMoney(value) { return Number(value || 0).toLocaleString("fr-FR") + " CDF"; }
function biloOrderCard(order, side, code) {
  const buyer = side === "buy", ready = order.status === "READY_FOR_DELIVERY", delivered = order.status === "DELIVERED";
  const item = esc(order.itemTitle || "Article Bilocost");
  const other = esc(buyer ? (order.sellerName || "Vendeur") : (order.buyerName || "Acheteur"));
  let action = "";
  if (buyer && ready && code) {
    action = '<div class="card" style="padding:12px;margin-top:10px"><b>Votre code de remise</b><div style="font-size:28px;letter-spacing:8px;font-weight:800;text-align:center;padding:12px 0">' + esc(code) + '</div><div class="sub">Communiquez ce code au vendeur uniquement après avoir reçu et vérifié l’article.</div></div>';
  } else if (buyer && ready) {
    action = '<div class="warn" style="margin-top:10px">Code temporairement indisponible. Actualisez la commande.</div>';
  } else if (!buyer && ready) {
    action = '<div class="card" style="padding:12px;margin-top:10px"><b>Confirmer la remise</b><label for="otp-' + esc(order.id) + '">Code à 6 chiffres fourni par l’acheteur</label><input class="f" id="otp-' + esc(order.id) + '" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"><button class="btn" style="margin-top:8px" data-otp-submit="' + esc(order.id) + '">Valider la livraison</button><div class="sub">5 essais maximum. Ne demandez le code qu’après la remise physique de l’article.</div></div>';
  }
  return '<div class="card" style="padding:14px;margin:10px 0"><div class="row"><b>' + item + '</b><span class="chip">' + (delivered ? "Terminée" : ready ? "À remettre" : "En attente") + '</span></div><p class="sub">' + (buyer ? "Vendeur" : "Acheteur") + ' : ' + other + '</p><div class="sum"><span>Montant indicatif</span><b>' + biloOrderMoney(order.totalCDF) + '</b></div><div class="sub">' + esc(biloOrderStatus(order.status)) + ' • ' + (order.createdAt && order.createdAt.toDate ? order.createdAt.toDate().toLocaleString("fr-FR") : "Date récente") + '</div>' + action + '</div>';
}
async function biloLoadOrders(side) {
  if (!CLOUD || !S.user) { sheet('<h2>Commandes sécurisées</h2><p class="sub">Connectez-vous pour consulter vos commandes.</p>'); return; }
  sheet('<h2>' + (side === "buy" ? "Mes achats sécurisés" : "Mes ventes sécurisées") + '</h2><p class="sub">Chargement des commandes…</p>');
  try {
    const F = FB.F, field = side === "buy" ? "buyerId" : "sellerId";
    const q = F.query(F.collection(FB.db, "orders"), F.where(field, "==", S.user.uid), F.orderBy("createdAt", "desc"), F.limit(50));
    const snap = await F.getDocs(q), orders = snap.docs.map(d => Object.assign({ id: d.id }, d.data())), cards = [];
    for (const order of orders) {
      let code = null;
      if (side === "buy" && order.status === "READY_FOR_DELIVERY") {
        try { const secret = await F.getDoc(F.doc(FB.db, "deliveryCodes", order.id)); if (secret.exists()) code = secret.data().code; }
        catch (e) { console.warn("Delivery code is not readable", e); }
      }
      cards.push(biloOrderCard(order, side, code));
    }
    sheet('<h2>' + (side === "buy" ? "Mes achats sécurisés" : "Mes ventes sécurisées") + '</h2><p class="sub">Le code de remise est créé uniquement après confirmation du paiement par un administrateur ou le prestataire de paiement.</p>' + (cards.join("") || '<div class="empty"><b>Aucune commande pour le moment</b><br>Les commandes créées depuis la messagerie apparaîtront ici.</div>') + '<button class="btn out" style="margin-top:8px" data-otp-refresh="' + side + '">Actualiser</button>');
  } catch (e) {
    console.error("Bilocost order list", e);
    sheet('<h2>Commandes sécurisées</h2><div class="warn">Impossible de charger les commandes (' + esc(e.code || "erreur") + '). Vérifiez les règles Firestore et l’index demandé.</div>');
  }
}
function secure(k) {
  if (k === "buy" || k === "sell") { biloLoadOrders(k); return; }
  const title = k === "pbuy" ? "Protection acheteur" : "Protection vendeur";
  sheet('<h2>' + title + '</h2><p class="sub">Les demandes de litige et les remboursements seront activés après la connexion du prestataire de paiement. Aucun remboursement automatique n’est simulé.</p>');
}
function termsSheet() {
  const info = S.chatInfo || {}, item = info.itemId && findItem(info.itemId);
  if (!item || !CLOUD) { toast("Connectez-vous pour créer une commande."); return; }
  const a = agreement(S.chatMsgs || [], item), receive = S.recv[S.chatId] || (dl(item).mode === "delivery" ? "delivery" : "pickup");
  const fee = receive === "delivery" ? a.dfee : 0;
  sheet('<h2>Récapitulatif de la commande</h2><div class="seller"><span class="ph th" style="background:' + item.bg + '">' + pic(item) + '</span><span style="flex:1"><b>' + esc(item.t) + '</b><br><small class="sub">Vendeur : ' + esc(item.s) + '</small></span></div><div class="sum"><span>Produit</span><b>' + biloOrderMoney(a.price) + '</b></div><div class="sum"><span>Livraison</span><b>' + biloOrderMoney(fee) + '</b></div><div class="sum"><span>Total</span><b>' + biloOrderMoney(a.price + fee) + '</b></div><div class="warn"><b>Commande sans prélèvement</b><br>Cette étape enregistre la commande. Aucun paiement n’est encaissé et aucun code de livraison n’est activé avant confirmation réelle du paiement par le prestataire.</div><button class="btn" data-otp-create>Créer la commande</button>');
}
async function startTerms() {
  const info = S.chatInfo || {};
  if (!info.itemId || !S.chatId) return toast("Conversation ou article introuvable.");
  try {
    await biloDeliveryCall("createDeliveryOrder", { itemId: String(info.itemId), chatId: String(S.chatId), receive: S.recv[S.chatId] || "pickup" });
    close_(); toast("Commande créée. En attente de paiement."); biloLoadOrders("buy");
  } catch (e) { console.error("Create delivery order", e); toast("Création impossible : " + (e.message || e.code || "erreur")); }
}
async function biloSubmitDelivery(orderId) {
  const input = document.getElementById("otp-" + orderId), code = input ? input.value.trim() : "";
  if (!/^\d{6}$/.test(code)) return toast("Entrez un code à 6 chiffres.");
  try { await biloDeliveryCall("confirmDelivery", { orderId, code }); toast("Livraison confirmée. Le code ne peut plus être réutilisé."); biloLoadOrders("sell"); }
  catch (e) { console.error("Delivery confirmation", e); toast(e.message || "Code incorrect ou expiré."); }
}
document.addEventListener("click", e => {
  const create = e.target.closest("[data-otp-create]");
  if (create) { e.preventDefault(); startTerms(); return; }
  const submit = e.target.closest("[data-otp-submit]");
  if (submit) { e.preventDefault(); biloSubmitDelivery(submit.dataset.otpSubmit); return; }
  const refresh = e.target.closest("[data-otp-refresh]");
  if (refresh) { e.preventDefault(); biloLoadOrders(refresh.dataset.otpRefresh); }
});
