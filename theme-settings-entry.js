/* Connect the existing Bilocost settings row to the 100-colour palette. */
(() => {
  "use strict";
  if (window.__biloThemeSettingsEntry) return;
  window.__biloThemeSettingsEntry = true;

  const openPalette = () => {
    if (typeof window.biloOpenThemeCustomizer !== "function") return false;
    window.biloOpenThemeCustomizer();
    return true;
  };

  // The actual settings page uses data-act="theme" and renders "Thème : clair/sombre/automatique".
  // Bind to that stable action instead of comparing the whole changing row text.
  const settingSelector = '#view [data-act="theme"], #view #theme';
  const decorate = () => {
    document.querySelectorAll(settingSelector).forEach(row => {
      row.setAttribute("data-bilo-theme-entry", "true");
      if (row.querySelector(".bilo-theme-entry-badge")) return;
      const badge = document.createElement("span");
      badge.className = "bilo-theme-entry-badge";
      badge.textContent = "100 couleurs";
      badge.setAttribute("aria-label", "Ouvrir les 100 palettes de couleurs");
      row.appendChild(badge);
    });
  };

  document.addEventListener("click", event => {
    const row = event.target.closest && event.target.closest(settingSelector);
    if (!row) return;
    if (openPalette()) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);

  const style = document.createElement("style");
  style.textContent = `
    #view [data-bilo-theme-entry]{display:flex;align-items:center;justify-content:space-between;gap:8px}
    .bilo-theme-entry-badge{display:inline-flex;align-items:center;flex:none;margin-left:auto;padding:5px 9px;border-radius:999px;background:var(--mint,#eaf6ee);color:var(--pri,#009a49);font-size:10px;font-weight:800;white-space:nowrap}
    .bilo-theme-panel{font-family:Inter,system-ui,sans-serif}
  `;
  document.head.appendChild(style);

  const start = () => {
    decorate();
    const view = document.getElementById("view");
    if (view && window.MutationObserver) {
      new MutationObserver(decorate).observe(view, {childList:true, subtree:true, characterData:true});
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
  else start();
})();