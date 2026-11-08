/* Bilocost rewarded theme unlock — native AdMob only. Google test ad units are used until production IDs are supplied. */
(() => {
  "use strict";
  const KEY = "bilocost_theme_rewards_v1";
  const COLORS = {
    green: {name:"Vert Bilocost", pri:"#009a49", dark:"#006b30", mint:"#ecfdf5", mintText:"#047857", free:true},
    blue: {name:"Bleu océan", pri:"#2563eb", dark:"#1d4ed8", mint:"#eff6ff", mintText:"#1d4ed8"},
    purple: {name:"Violet", pri:"#7c3aed", dark:"#5b21b6", mint:"#f5f3ff", mintText:"#6d28d9"},
    orange: {name:"Orange", pri:"#ea580c", dark:"#c2410c", mint:"#fff7ed", mintText:"#c2410c"},
    rose: {name:"Rose", pri:"#e11d48", dark:"#be123c", mint:"#fff1f2", mintText:"#be123c"},
    teal: {name:"Turquoise", pri:"#0d9488", dark:"#0f766e", mint:"#f0fdfa", mintText:"#0f766e"}
  };
  const TEST_UNITS = {
    android: "ca-app-pub-3940256099942544/5224354917",
    ios: "ca-app-pub-3940256099942544/1712485313"
  };
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {unlocked:["green"], progress:{}, selected:"green"}; } catch (_) { return {unlocked:["green"],progress:{},selected:"green"}; } };
  let state = read();
  if (!Array.isArray(state.unlocked)) state.unlocked = ["green"];
  if (!state.progress || typeof state.progress !== "object") state.progress = {};
  if (!COLORS[state.selected] || !state.unlocked.includes(state.selected)) state.selected = "green";
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
  const apply = id => {
    const c = COLORS[id] || COLORS.green;
    const root = document.documentElement;
    root.style.setProperty("--pri", c.pri);
    root.style.setProperty("--pri-d", c.dark);
    root.style.setProperty("--mint", c.mint);
    root.style.setProperty("--mint-t", c.mintText);
    root.style.setProperty("--theme-accent", c.pri);
    root.dataset.biloTheme = id;
    state.selected = id; save();
  };
  apply(state.selected);
  const adMob = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
  const progress = id => Math.min(2, Number(state.progress[id] || 0));
  function openThemeCustomizer() {
    const cards = Object.entries(COLORS).map(([id,c]) => {
      const unlocked = state.unlocked.includes(id);
      const n = progress(id);
      return '<button type="button" class="bilo-theme-option" data-bilo-theme-select="'+id+'" style="--swatch:'+c.pri+'" '+(!unlocked?'disabled':'')+'>'+
        '<span class="bilo-theme-swatch"></span><span class="bilo-theme-name">'+c.name+'</span>'+
        (unlocked ? (state.selected===id?'<span class="bilo-theme-state">Actif</span>':'<span class="bilo-theme-state">Débloqué</span>') :
        '<span class="bilo-theme-state">🔒 '+n+'/2 pubs</span>')+'</button>';
    }).join("");
    sheet('<div class="bilo-theme-panel"><div class="bilo-theme-top"><div><small>PERSONNALISATION</small><h2>Choisir mes couleurs</h2><p>Regardez 2 publicités récompensées pour débloquer une couleur.</p></div><span class="bilo-theme-brand">B</span></div><div class="bilo-theme-grid">'+cards+'</div><p class="bilo-theme-foot">Le vert Bilocost reste gratuit. Chaque couleur débloquée est mémorisée sur cet appareil.</p><button class="btn ghost" type="button" data-bilo-theme-close>Fermer</button></div>');
  }
  async function watchForTheme(id) {
    const plugin = adMob();
    if (!plugin) { if (typeof toast === "function") toast("Les publicités récompensées seront disponibles dans l’application Android/iOS."); return; }
    const platform = window.Capacitor.getPlatform ? window.Capacitor.getPlatform() : "android";
    const adId = TEST_UNITS[platform];
    if (!adId) { if (typeof toast === "function") toast("Plateforme publicitaire non prise en charge."); return; }
    let rewarded = false, rewardListener, dismissListener, failListener;
    try {
      if (plugin.initialize) await plugin.initialize();
      rewardListener = await plugin.addListener("onRewardedVideoAdReward", () => {
        if (rewarded) return;
        rewarded = true;
        state.progress[id] = progress(id) + 1;
        if (state.progress[id] >= 2) {
          state.progress[id] = 2;
          if (!state.unlocked.includes(id)) state.unlocked.push(id);
          if (typeof toast === "function") toast(COLORS[id].name+" débloqué !");
        } else if (typeof toast === "function") toast("1/2 publicité terminée. Encore une pour débloquer "+COLORS[id].name+".");
        save();
        openThemeCustomizer();
      });
      dismissListener = await plugin.addListener("onRewardedVideoAdDismissed", () => {
        if (!rewarded && typeof toast === "function") toast("Publicité fermée sans récompense : aucun déblocage.");
      });
      failListener = await plugin.addListener("onRewardedVideoAdFailedToLoad", () => {
        if (typeof toast === "function") toast("Publicité indisponible. Réessayez plus tard.");
      });
      await plugin.prepareRewardVideoAd({adId, isTesting:true});
      await plugin.showRewardVideoAd();
    } catch (err) {
      if (typeof toast === "function") toast("Impossible de charger la publicité. Réessayez plus tard.");
      console.warn("Bilocost AdMob rewarded error", err);
    } finally {
      setTimeout(() => { [rewardListener,dismissListener,failListener].forEach(x=>{try{x&&x.remove&&x.remove()}catch(_){}}); }, 1500);
    }
  }
  document.addEventListener("click", e => {
    const select = e.target.closest && e.target.closest("[data-bilo-theme-select]");
    if (select) {
      const id = select.getAttribute("data-bilo-theme-select");
      if (state.unlocked.includes(id)) { apply(id); if (typeof close_ === "function") close_(); if (typeof renderPage === "function") renderPage(); }
      else watchForTheme(id);
      return;
    }
    if (e.target.closest && e.target.closest("[data-bilo-theme-close]")) {
      if (typeof close_ === "function") close_();
    }
  });
  const style = document.createElement("style");
  style.textContent = '.bilo-theme-panel{color:var(--ink)}.bilo-theme-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}.bilo-theme-top small{font:800 9px Inter,sans-serif;letter-spacing:.12em;color:var(--pri)}.bilo-theme-top h2{margin:4px 0;font-size:19px}.bilo-theme-top p,.bilo-theme-foot{font-size:12px;color:var(--mute);line-height:1.5;margin:0}.bilo-theme-brand{width:42px;height:42px;border-radius:13px;background:var(--pri);color:white;display:grid;place-items:center;font-weight:900;font-size:25px}.bilo-theme-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:14px 0}.bilo-theme-option{display:flex;align-items:center;gap:8px;min-width:0;padding:12px 9px;border:1px solid var(--line);border-radius:14px;background:var(--card);color:var(--ink);text-align:left}.bilo-theme-option:disabled{opacity:.82}.bilo-theme-swatch{width:24px;height:24px;flex:none;border-radius:8px;background:var(--swatch)}.bilo-theme-name{font-size:11px;font-weight:800;flex:1}.bilo-theme-state{font-size:9px;color:var(--pri);font-weight:800;white-space:nowrap}.bilo-theme-foot{margin:0 0 12px}@media(max-width:360px){.bilo-theme-grid{grid-template-columns:1fr}}';
  document.head.appendChild(style);
  window.biloOpenThemeCustomizer = openThemeCustomizer;
})();
