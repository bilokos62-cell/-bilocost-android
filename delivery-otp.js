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
    const snap = await F.getDocs(q), orders = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
    const readyOrders = side === "buy" ? orders.filter(order => order.status === "READY_FOR_DELIVERY") : [];
    const codeEntries = [];
    for (let i = 0; i < readyOrders.length; i += 10) {
      const batch = readyOrders.slice(i, i + 10);
      const entries = await Promise.all(batch.map(async order => {
        try {
          const secret = await F.getDoc(F.doc(FB.db, "deliveryCodes", order.id));
          return [order.id, secret.exists() ? secret.data().code : null];
        } catch (e) {
          console.warn("Delivery code is not readable", e);
          return [order.id, null];
        }
      }));
      codeEntries.push(...entries);
    }
    const deliveryCodes = new Map(codeEntries);
    const cards = orders.map(order => biloOrderCard(order, side, deliveryCodes.get(order.id) || null));
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


/* Bilocost in-app inbox: order codes, account notices and promotions. */
let BILO_INBOX_FILTER = "all";
let BILO_INBOX_BADGE_BUSY = false;
let BILO_INBOX_BADGE_LAST_AT = 0;
let BILO_INBOX_BADGE_UID = "";
function biloInstallInboxIcon() {
  // The inbox is accessed from the Messages area, not as another permanent header icon.
}
async function biloRefreshInboxBadge(force) {
  if (BILO_INBOX_BADGE_BUSY || !CLOUD || !S.user || !FB.F || !FB.db) return;
  const uid = S.user.uid, now = Date.now();
  if (!force && uid === BILO_INBOX_BADGE_UID && now - BILO_INBOX_BADGE_LAST_AT < 15000) return;
  BILO_INBOX_BADGE_BUSY = true;
  try {
    const F = FB.F, q = F.query(F.collection(FB.db, "inboxNotifications"), F.where("ownerId", "==", uid), F.orderBy("createdAt", "desc"), F.limit(80));
    const snap = await F.getDocs(q), count = snap.docs.filter(d => d.data().read !== true).length, badge = document.getElementById("biloInboxBadge");
    if (badge) { badge.textContent = count > 99 ? "99+" : String(count); badge.style.display = count ? "block" : "none"; }
    BILO_INBOX_BADGE_UID = uid;
    BILO_INBOX_BADGE_LAST_AT = Date.now();
  } catch (e) { console.warn("Bilocost inbox badge", e); }
  finally { BILO_INBOX_BADGE_BUSY = false; }
}
function biloInboxCategory(type) {
  if (type === "delivery_code" || type.indexOf("order_") === 0) return "orders";
  if (type === "chat_message") return "messages";
  if (type === "promotion") return "promos";
  return "system";
}
function biloInboxCard(n) {
  const date = n.createdAt && n.createdAt.toDate ? n.createdAt.toDate().toLocaleString("fr-FR") : "Récemment";
  const code = n.type === "delivery_code" && n.code ? '<div class="card" style="padding:12px;margin-top:10px"><b>Code de remise</b><div style="font-size:30px;letter-spacing:8px;font-weight:800;text-align:center;padding:10px 0">' + esc(n.code) + '</div><div class="sub">À communiquer au vendeur uniquement après avoir reçu et vérifié l’article.</div></div>' : "";
  const order = n.orderId ? '<button class="lnk" data-inbox-order="' + esc(n.orderId) + '" data-inbox-side="' + esc(n.side || "buy") + '" style="margin-top:8px">Voir la commande</button>' : "";
  const chat = n.chatId ? '<button class="lnk" data-inbox-chat="' + esc(n.chatId) + '" style="margin-top:8px">Ouvrir les messages</button>' : "";
  return '<article class="card" style="padding:13px;margin:9px 0;border-left:3px solid ' + (n.read ? "var(--line)" : "var(--pri)") + '"><div class="row"><b>' + esc(n.title || "Notification Bilocost") + '</b><span class="chip">' + (n.read ? "Lue" : "Nouvelle") + '</span></div><p style="margin:8px 0">' + esc(n.body || "") + '</p>' + code + '<div class="sub" style="margin-top:8px">' + esc(date) + '</div>' + order + chat + (!n.read ? '<button class="lnk" data-inbox-read="' + esc(n.id) + '" style="margin-left:12px">Marquer comme lue</button>' : "") + '</article>';
}
async function biloOpenInbox(filter) {
  if (!S.user || !CLOUD) { sheet('<h2>Boîte de réception</h2><p class="sub">Connectez-vous pour recevoir vos codes et notifications Bilocost.</p>'); return; }
  BILO_INBOX_FILTER = filter || BILO_INBOX_FILTER || "all";
  sheet('<h2>Boîte de réception</h2><p class="sub">Vos codes de remise, informations de commande et promotions sont réunis ici.</p><div class="tabs" style="margin-top:12px"><button data-inbox-filter="all" aria-pressed="' + (BILO_INBOX_FILTER === "all") + '">Tout</button><button data-inbox-filter="orders" aria-pressed="' + (BILO_INBOX_FILTER === "orders") + '">Commandes</button><button data-inbox-filter="messages" aria-pressed="' + (BILO_INBOX_FILTER === "messages") + '">Messages</button><button data-inbox-filter="system" aria-pressed="' + (BILO_INBOX_FILTER === "system") + '">Infos</button><button data-inbox-filter="promos" aria-pressed="' + (BILO_INBOX_FILTER === "promos") + '">Promos</button></div><div class="sub" style="padding:12px 0">Chargement…</div>');
  try {
    const F = FB.F, q = F.query(F.collection(FB.db, "inboxNotifications"), F.where("ownerId", "==", S.user.uid), F.orderBy("createdAt", "desc"), F.limit(80));
    const snap = await F.getDocs(q), all = snap.docs.map(d => Object.assign({id:d.id}, d.data()));
    const filtered = BILO_INBOX_FILTER === "all" ? all : all.filter(n => biloInboxCategory(n.type) === BILO_INBOX_FILTER);
    const tabs = '<div class="tabs" style="margin-top:12px"><button data-inbox-filter="all" aria-pressed="' + (BILO_INBOX_FILTER === "all") + '">Tout</button><button data-inbox-filter="orders" aria-pressed="' + (BILO_INBOX_FILTER === "orders") + '">Commandes</button><button data-inbox-filter="messages" aria-pressed="' + (BILO_INBOX_FILTER === "messages") + '">Messages</button><button data-inbox-filter="system" aria-pressed="' + (BILO_INBOX_FILTER === "system") + '">Infos</button><button data-inbox-filter="promos" aria-pressed="' + (BILO_INBOX_FILTER === "promos") + '">Promos</button></div>';
    sheet('<h2>Boîte de réception</h2><p class="sub">Codes de remise, commandes, informations et promotions Bilocost.</p>' + tabs + (filtered.map(biloInboxCard).join("") || '<div class="empty" style="margin-top:14px">Aucun message dans cette rubrique.</div>') + '<button class="btn out" style="margin-top:10px" data-inbox-refresh>Actualiser</button>');
    biloRefreshInboxBadge();
  } catch (e) {
    console.error("Bilocost inbox", e);
    sheet('<h2>Boîte de réception</h2><div class="warn">Impossible de charger les notifications (' + esc(e.code || "erreur") + '). Vérifiez les règles Firestore et les index.</div><button class="btn out" data-inbox-refresh>Réessayer</button>');
  }
}
async function biloMarkInboxRead(notificationId) {
  try { await biloDeliveryCall("markInboxNotificationRead", {notificationId}); biloOpenInbox(); biloRefreshInboxBadge(true); }
  catch (e) { toast(e.message || "Impossible de mettre à jour le message."); }
}
let BILO_SHOW_INBOX_ENTRY = false;
function biloEnsureInboxEntry() {
  const view = document.getElementById("view");
  if (!BILO_SHOW_INBOX_ENTRY || !view || view.querySelector("#biloInboxEntry")) return;
  const button = document.createElement("button");
  button.id = "biloInboxEntry";
  button.type = "button";
  button.className = "btn out";
  button.style.cssText = "width:100%;margin:0 0 12px;display:flex;align-items:center;justify-content:space-between";
  button.innerHTML = '<span>Boîte de réception · Codes et notifications</span><b id="biloInboxEntryBadge" style="display:none;background:var(--pri);color:#fff;border-radius:20px;padding:2px 8px;font-size:11px"></b>';
  button.addEventListener("click",()=>biloOpenInbox("all"));
  view.prepend(button);
  const source=document.getElementById("biloInboxBadge"), target=document.getElementById("biloInboxEntryBadge");
  if(source&&target&&source.textContent){target.textContent=source.textContent;target.style.display=source.style.display==="none"?"none":"inline-block";}
}
document.addEventListener("click",e=>{
  const navItem=e.target.closest("nav button[data-t]");
  if(navItem){
    BILO_SHOW_INBOX_ENTRY=navItem.dataset.t==="msg";
    if(!BILO_SHOW_INBOX_ENTRY){const old=document.getElementById("biloInboxEntry");if(old)old.remove();}
    else setTimeout(biloEnsureInboxEntry,120);
  }
});
const biloOriginalRender = render;
render = function() { biloOriginalRender(); biloRefreshInboxBadge(); biloEnsureInboxEntry(); };
document.addEventListener("click", e => {
  const inbox = e.target.closest("#biloInboxButton");
  if (inbox) { e.preventDefault(); biloOpenInbox("all"); return; }
  const filter = e.target.closest("[data-inbox-filter]");
  if (filter) { e.preventDefault(); biloOpenInbox(filter.dataset.inboxFilter); return; }
  const read = e.target.closest("[data-inbox-read]");
  if (read) { e.preventDefault(); biloMarkInboxRead(read.dataset.inboxRead); return; }
  if (e.target.closest("[data-inbox-refresh]")) { e.preventDefault(); biloOpenInbox(); return; }
  if (e.target.closest("[data-inbox-chat]")) { e.preventDefault(); close_(); const nav = document.querySelector('nav button[data-t="msg"]'); if (nav) nav.click(); return; }
  const order = e.target.closest("[data-inbox-order]");
  if (order) { e.preventDefault(); biloLoadOrders(order.dataset.inboxSide || "buy"); return; }
});
