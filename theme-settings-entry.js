/* Connect the existing Bilocost theme setting to the 100-colour palette. */
(() => {
  "use strict";
  if (window.__biloThemeSettingsEntry) return;
  window.__biloThemeSettingsEntry = true;
  const labels = new Set(["thème", "thème de l'application", "thème de l’application", "apparence"]);
  const norm = value => String(value || "").replace(/\s+/g, " ").trim().toLocaleLowerCase("fr");
  const open = () => {
    if (typeof window.biloOpenThemeCustomizer === "function") {
      window.biloOpenThemeCustomizer();
      return true;
    }
    return false;
  };
  function findSettingTarget(node) {
    if (!node || !node.closest) return null;
    const decorated = node.closest("[data-bilo-theme-entry]");
    if (decorated) return decorated;
    let el = node.closest("button,a,[role='button'],label,[data-action],.row,.setting,.settings-item");
    if (!el) el = node;
    for (let i = 0; el && i < 5; i++, el = el.parentElement) {
      if (labels.has(norm(el.textContent))) return el;
    }
    return null;
  }
  function decorate() {
    const view = document.getElementById("view");
    if (!view) return;
    const candidates = view.querySelectorAll("button,a,[role='button'],label,.row,.setting,.settings-item,h2,h3,h4,span,b,strong,div");
    for (const el of candidates) {
      if (!labels.has(norm(el.textContent))) continue;
      const target = el.closest("button,a,[role='button'],.row,.setting,.settings-item") || el;
      if (target.querySelector(".bilo-theme-entry-badge")) continue;
      const badge = document.createElement("span");
      badge.className = "bilo-theme-entry-badge";
      badge.textContent = "100 couleurs";
      badge.setAttribute("aria-label", "Ouvrir les 100 palettes de couleurs");
      target.appendChild(badge);
      target.setAttribute("data-bilo-theme-entry", "true");
    }
  }
  document.addEventListener("click", event => {
    const target = findSettingTarget(event.target);
    if (!target) return;
    if (open()) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);
  const style = document.createElement("style");
  style.textContent = ".bilo-theme-entry-badge{display:inline-flex;align-items:center;margin-left:8px;padding:4px 8px;border-radius:999px;background:var(--mint,#eaf6ee);color:var(--pri,#009a49);font-size:10px;font-weight:800;white-space:nowrap}.bilo-theme-panel{font-family:Inter,system-ui,sans-serif}";
  document.head.appendChild(style);
  const start = () => {
    decorate();
    const view = document.getElementById("view");
    if (view && window.MutationObserver) new MutationObserver(decorate).observe(view,{childList:true,subtree:true,characterData:true});
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
