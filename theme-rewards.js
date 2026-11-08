/* Bilocost rewarded theme unlock — native AdMob only. Google test ad units are used until production IDs are supplied. */
(() => {
  "use strict";
  const KEY = "bilocost_theme_rewards_v1";
  const ACCESS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours à partir du 2e visionnage récompensé.
  // 100 palettes: Bilocost green is free; the other 99 require two completed rewarded ads each.
  const COLORS = (() => {
    const palette = {green:{name:"Vert Bilocost",pri:"#009a49",dark:"#006b30",mint:"#ecfdf5",mintText:"#047857",free:true}};
    const hues = [0,12,24,36,48,60,72,84,96,108,120,132,144,156,168,180,192,204,216,228,240,252,264,276,288,300,312,324,336,348];
    let index = 1;
    for (const hue of hues) {
      for (const light of [38,46,54,62]) {
        if (index >= 100) break;
        const sat = 72 + ((index * 7) % 20);
        const pri = 'hsl('+hue+' '+sat+'% '+light+'%)';
        const dark = 'hsl('+hue+' '+sat+'% '+Math.max(24,light-12)+'%)';
        const mint = 'hsl('+hue+' 75% 97%)';
        const mintText = 'hsl('+hue+' 70% 32%)';
        const id = 'color'+String(index).padStart(2,'0');
        palette[id] = {name:'Couleur '+String(index).padStart(2,'0'),pri,dark,mint,mintText};
        index++;
      }
    }
    return palette;
  })();
  const TEST_UNITS = {
    android: "ca-app-pub-3940256099942544/5224354917",
    ios: "ca-app-pub-3940256099942544/1712485313"
  };
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {unlocked:["green"], progress:{}, selected:"green"}; } catch (_) { return {unlocked:["green"],progress:{},selected:"green"}; } };
  let state = read();
  if (!Array.isArray(state.unlocked)) state.unlocked = ["green"];
  if (!state.progress || typeof state.progress !== "object") state.progress = {};
  if (!state.expires || typeof state.expires !== "object") state.expires = {};
  // Migration des anciens déblocages locaux : ils deviennent temporaires (30 jours).
  const migrationNow = Date.now();
  state.unlocked.filter(id => id !== "green" && COLORS[id]).forEach(id => {
    if (!Number.isFinite(Number(state.expires[id]))) state.expires[id] = migrationNow + ACCESS_DURATION_MS;
  });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
  function refreshExpirations() {
    const now = Date.now();
    let changed = false;
    Object.keys(state.expires).forEach(id => {
      if (!Number.isFinite(Number(state.expires[id])) || Number(state.expires[id]) <= now) {
        delete state.expires[id];
        state.unlocked = state.unlocked.filter(x => x !== id);
        state.progress[id] = 0;
        if (state.selected === id) state.selected = "green";
        changed = true;
      }
    });
    if (changed) save();
    return changed;
  }
  const isUnlocked = id => id === "green" || (state.unlocked.includes(id) && Number(state.expires[id]) > Date.now());
  const remainingDays = id => Math.max(1, Math.ceil((Number(state.expires[id]) - Date.now()) / 86400000));
  let expiryTimer = null;
  function scheduleExpiration() {
    if (expiryTimer) clearTimeout(expiryTimer);
    const upcoming = Object.values(state.expires).map(Number).filter(t => t > Date.now());
    if (!upcoming.length) return;
    expiryTimer = setTimeout(() => {
      const changed = refreshExpirations();
      if (changed) {
        apply(state.selected);
        if (typeof renderPage === "function") renderPage();
      }
      scheduleExpiration();
    }, Math.min(2147483000, Math.max(0, Math.min(...upcoming) - Date.now() + 50)));
  }
  refreshExpirations();
  if (!COLORS[state.selected] || !isUnlocked(state.selected)) state.selected = "green";
  const apply = id => {
    refreshExpirations();
    if (!isUnlocked(id)) id = "green";
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
  scheduleExpiration();
  const adMob = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
  const progress = id => Math.min(2, Number(state.progress[id] || 0));
  function openThemeCustomizer() {
    refreshExpirations();
    const cards = Object.entries(COLORS).map(([id,c]) => {
      const unlocked = isUnlocked(id);
      const n = progress(id);
      return '<button type="button" class="bilo-theme-option '+(!unlocked?'is-locked':'is-unlocked')+'" data-bilo-theme-select="'+id+'" style="--swatch:'+c.pri+'" aria-label="'+c.name+(unlocked?' sélectionnable':' verrouillé, toucher pour regarder une publicité')+'">'+
        '<span class="bilo-theme-swatch"></span><span class="bilo-theme-name">'+c.name+'</span>'+
        (unlocked ? (state.selected===id?'<span class="bilo-theme-state">Actif · '+remainingDays(id)+' j</span>':'<span class="bilo-theme-state">Expire dans '+remainingDays(id)+' j</span>') :
        '<span class="bilo-theme-state">🔒 '+n+'/2 pubs</span>')+'</button>';
    }).join("");
    sheet('<div class="bilo-theme-panel"><div class="bilo-theme-top"><div><small>PERSONNALISATION</small><h2>Choisir mes couleurs</h2><p>Regardez 2 publicités récompensées pour débloquer une couleur.</p></div><span class="bilo-theme-brand">BILOCOST</span></div><div class="bilo-theme-grid">'+cards+'</div><p class="bilo-theme-foot">Le vert Bilocost reste gratuit. Chaque couleur premium est disponible pendant 30 jours après les 2 publicités récompensées, puis doit être débloquée à nouveau.</p><button class="btn ghost" type="button" data-bilo-theme-close>Fermer</button></div>');
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
          state.expires[id] = Date.now() + ACCESS_DURATION_MS;
          scheduleExpiration();
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
      refreshExpirations();
      if (isUnlocked(id)) { apply(id); if (typeof close_ === "function") close_(); if (typeof renderPage === "function") renderPage(); }
      else watchForTheme(id);
      return;
    }
    if (e.target.closest && e.target.closest("[data-bilo-theme-close]")) {
      if (typeof close_ === "function") close_();
    }
  });
  const style = document.createElement("style");
  style.textContent = '.bilo-theme-panel{color:var(--ink);max-height:78vh;overflow-y:auto;overscroll-behavior:contain;padding:2px 3px 6px}.bilo-theme-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}.bilo-theme-top small{font:800 9px Inter,sans-serif;letter-spacing:.12em;color:var(--pri)}.bilo-theme-top h2{margin:4px 0;font-size:19px}.bilo-theme-top p,.bilo-theme-foot{font-size:12px;color:var(--mute);line-height:1.5;margin:0}.bilo-theme-brand{padding:10px 12px;border-radius:12px;background:var(--pri);color:white;display:grid;place-items:center;font-weight:900;font-size:11px;letter-spacing:.08em;white-space:nowrap}.bilo-theme-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:14px 0}.bilo-theme-option{display:flex;align-items:center;gap:8px;min-width:0;padding:12px 9px;border:1px solid var(--line);border-radius:14px;background:var(--card);color:var(--ink);text-align:left}.bilo-theme-option.is-locked{background:var(--bg);border-style:dashed}.bilo-theme-option.is-locked .bilo-theme-state{color:var(--mute)}.bilo-theme-swatch{width:24px;height:24px;flex:none;border-radius:8px;background:var(--swatch)}.bilo-theme-name{font-size:11px;font-weight:800;flex:1}.bilo-theme-state{font-size:9px;color:var(--pri);font-weight:800;white-space:nowrap}.bilo-theme-foot{margin:0 0 12px}@media(max-width:360px){.bilo-theme-grid{grid-template-columns:1fr}}';
  document.head.appendChild(style);
  window.biloOpenThemeCustomizer = openThemeCustomizer;
})();
