(() => {
  "use strict";
  const FIREBASE_VERSION = "11.10.0";
  const RATE_DOC = "exchange_rates/current";
  const money = value => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
  let currentRate = null, rateDate = "", rateStatus = "loading", panel = null, amount = 1;

  const ensureStyles = () => {
    if (document.getElementById("bilo-exchange-styles")) return;
    const style = document.createElement("style");
    style.id = "bilo-exchange-styles";
    style.textContent = "#bilo-exchange-bar{display:flex;align-items:center;justify-content:center;gap:7px;min-height:34px;padding:5px 12px;background:var(--panel);border-bottom:1px solid var(--line);font:600 12px/1.3 Inter,system-ui,sans-serif;color:var(--ink);z-index:20}#bilo-exchange-bar button{border:0;background:transparent;color:var(--ink);font:inherit;display:inline-flex;align-items:center;gap:7px;padding:3px 8px;border-radius:9px;cursor:pointer}#bilo-exchange-bar strong{color:var(--pri);font-weight:800}#bilo-exchange-bar .bilo-rate-source{color:var(--mute);font-size:10px}#bilo-exchange-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.58);z-index:10050;display:grid;place-items:center;padding:18px}#bilo-exchange-panel{width:min(100%,430px);max-height:min(86vh,700px);overflow:auto;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:22px;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,.3);font-family:Inter,system-ui,sans-serif}#bilo-exchange-panel h2{font-size:20px;margin:0 0 5px;color:var(--ink)}#bilo-exchange-panel .bilo-rate-date{color:var(--mute);font-size:12px;margin-bottom:16px}#bilo-exchange-panel .bilo-rate-main{padding:16px;border-radius:16px;background:var(--panel);margin-bottom:14px}#bilo-exchange-panel .bilo-rate-main strong{display:block;font-size:25px;color:var(--pri);margin-top:4px}#bilo-exchange-panel .bilo-rate-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}#bilo-exchange-panel .bilo-rate-cell{padding:12px;border:1px solid var(--line);border-radius:13px;color:var(--mute);font-size:12px}#bilo-exchange-panel .bilo-rate-cell b{display:block;color:var(--ink);font-size:16px;margin-top:4px}#bilo-exchange-panel label{display:block;color:var(--mute);font-size:12px;margin:15px 0 6px}#bilo-exchange-panel input{box-sizing:border-box;width:100%;min-height:48px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--ink);font:600 16px Inter,system-ui,sans-serif}#bilo-exchange-panel .bilo-converted{font-size:22px;font-weight:800;color:var(--pri);padding:12px 0}#bilo-exchange-panel .bilo-rate-note{font-size:11px;line-height:1.5;color:var(--mute)}#bilo-exchange-panel .bilo-rate-close{width:100%;margin-top:14px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--ink);font-weight:700}@media(max-width:480px){#bilo-exchange-bar{font-size:11px;justify-content:flex-start;overflow:hidden;white-space:nowrap}}";
    document.head.appendChild(style);
  };

  const renderBar = () => {
    ensureStyles();
    const header = document.querySelector("header");
    if (!header || !header.parentNode) return;
    let bar = document.getElementById("bilo-exchange-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "bilo-exchange-bar";
      header.insertAdjacentElement("afterend", bar);
    }
    const label = rateStatus === "loading" ? "Chargement du taux BCC…" :
      rateStatus === "error" ? "Taux BCC indisponible" :
      "1 USD = " + money(currentRate.mean) + " CDF";
    bar.innerHTML = '<button type="button" id="bilo-exchange-open" aria-label="Ouvrir le convertisseur de devises"><span aria-hidden="true">⇄</span><strong>' + label + '</strong><span class="bilo-rate-source">Taux officiel BCC · Convertisseur</span></button>';
    bar.querySelector("#bilo-exchange-open").addEventListener("click", openPanel);
  };

  const renderPanel = () => {
    if (!panel) return;
    const rate = currentRate;
    const result = rate ? money((Number(amount) || 0) * rate.mean) : "—";
    const stale = rate && rateDate && (Date.now() - new Date(rateDate + "T23:59:59+01:00").getTime()) > 4 * 86400000;
    const fetched = rate && rate.fetchedAt && rate.fetchedAt.toDate ? rate.fetchedAt.toDate().toLocaleString("fr-FR") : "—";
    panel.innerHTML = '<section id="bilo-exchange-panel" role="dialog" aria-modal="true" aria-labelledby="bilo-exchange-title">' +
      '<h2 id="bilo-exchange-title">Taux de change Bilocost</h2>' +
      '<div class="bilo-rate-date">' + (rate ? "Source : Banque Centrale du Congo · Publication du " + rate.publicationDate : "En attente de la première cotation officielle") + '</div>' +
      '<div class="bilo-rate-main"><span>Taux moyen officiel</span><strong>' + (rate ? "1 USD = " + money(rate.mean) + " CDF" : "Indisponible") + '</strong></div>' +
      '<div class="bilo-rate-grid"><div class="bilo-rate-cell">Cours acheteur<b>' + (rate ? money(rate.buy) + " CDF" : "—") + '</b></div><div class="bilo-rate-cell">Cours vendeur<b>' + (rate ? money(rate.sell) + " CDF" : "—") + '</b></div></div>' +
      '<label for="bilo-exchange-amount">Convertir des dollars en francs congolais</label><input id="bilo-exchange-amount" type="number" min="0" step="0.01" inputmode="decimal" value="' + amount + '">' +
      '<div class="bilo-converted" id="bilo-exchange-result">' + result + ' CDF</div>' +
      '<div class="bilo-rate-note">' + (stale ? "Attention : la dernière cotation officielle date de plus de 4 jours. Elle est conservée en attendant une nouvelle publication." : "Le taux est mis à jour automatiquement après publication par la BCC. Il s'agit d'un taux officiel indicatif, pas d'une promesse de taux de transaction.") + '<br>Dernière récupération : ' + fetched + '</div>' +
      '<button type="button" class="bilo-rate-close" id="bilo-exchange-close">Fermer</button></section>';
    panel.querySelector("#bilo-exchange-close").addEventListener("click", closePanel);
    panel.querySelector("#bilo-exchange-amount").addEventListener("input", event => {
      amount = Math.max(0, Number(event.target.value) || 0);
      const output = panel.querySelector("#bilo-exchange-result");
      if (output) output.textContent = rate ? money(amount * rate.mean) + " CDF" : "—";
    });
  };

  function openPanel() {
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "bilo-exchange-backdrop";
      panel.addEventListener("click", event => { if (event.target === panel) closePanel(); });
      document.body.appendChild(panel);
    }
    renderPanel();
    panel.hidden = false;
  }
  function closePanel() { if (panel) panel.hidden = true; }

  async function connect() {
    try {
      const version = FIREBASE_VERSION;
      const modules = await Promise.all([
        import("https://www.gstatic.com/firebasejs/" + version + "/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/" + version + "/firebase-firestore.js")
      ]);
      const appSdk = modules[0], firestore = modules[1];
      const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(window.BILO_FIREBASE);
      const db = firestore.getFirestore(app);
      firestore.onSnapshot(firestore.doc(db, RATE_DOC), snapshot => {
        if (!snapshot.exists()) { rateStatus = "error"; currentRate = null; }
        else { currentRate = snapshot.data(); rateDate = currentRate.publicationDate || ""; rateStatus = "ready"; }
        renderBar();
        if (panel && !panel.hidden) renderPanel();
      }, error => {
        console.error("Bilocost exchange rate listener:", error);
        rateStatus = "error"; renderBar();
      });
    } catch (error) {
      console.error("Bilocost exchange rate initialization:", error);
      rateStatus = "error"; renderBar();
    }
  }

  const install = () => {
    renderBar();
    const observer = new MutationObserver(() => { if (!document.getElementById("bilo-exchange-bar")) renderBar(); });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("keydown", event => { if (event.key === "Escape") closePanel(); });
    connect();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
