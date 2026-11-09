/* Connect Bilocost settings to the complete personalization hub. */
(() => {
  "use strict";
  if (window.__biloThemeSettingsEntry) return;
  window.__biloThemeSettingsEntry = true;

  const selector = '#view [data-act="theme"], #view #theme, #view [data-bilo-theme-entry]';
  const labels = new Set(["thème", "thème de l'application", "thème de l’application", "apparence"]);
  const norm = value => String(value || "").replace(/\s+/g, " ").trim().toLocaleLowerCase("fr");

  const openPalette = () => {
    if (typeof window.biloOpenPersonalizationHub === "function") window.biloOpenPersonalizationHub();
    else if (typeof window.biloOpenThemeCustomizer === "function") window.biloOpenThemeCustomizer();
    else return false;
    return true;
  };

  const findTarget = node => {
    if (!node || !node.closest) return null;
    const direct = node.closest(selector);
    if (direct) return direct;
    let el = node.closest("button,a,[role='button'],label,[data-action],.row,.setting,.settings-item") || node;
    for (let i = 0; el && i < 5; i++, el = el.parentElement) {
      if (labels.has(norm(el.textContent))) return el;
    }
    return null;
  };

  const decorate = () => {
    const view = document.getElementById("view");
    if (!view) return;
    const targets = new Set(view.querySelectorAll(selector));
    for (const el of view.querySelectorAll("button,a,[role='button'],label,.row,.setting,.settings-item,h2,h3,h4,span,b,strong,div")) {
      if (labels.has(norm(el.textContent))) {
        targets.add(el.closest("button,a,[role='button'],.row,.setting,.settings-item") || el);
      }
    }
    for (const target of targets) {
      target.setAttribute("data-bilo-theme-entry", "true");
      if (target.querySelector(".bilo-theme-entry-badge")) continue;
      const badge = document.createElement("span");
      badge.className = "bilo-theme-entry-badge";
      badge.textContent = "Couleurs & designs";
      badge.setAttribute("aria-label", "Ouvrir les couleurs et designs Bilocost");
      target.appendChild(badge);
    }
  };

  document.addEventListener("click", event => {
    const target = findTarget(event.target);
    if (!target || !openPalette()) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
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
    // Observe the document, not only the initial #view node: authentication can
    // replace the settings container after login and detach the old observer target.
    if (window.MutationObserver && document.documentElement) {
      new MutationObserver(decorate).observe(document.documentElement, {
        childList:true, subtree:true, characterData:true
      });
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
  else start();
})();
