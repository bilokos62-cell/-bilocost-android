/* Bilocost professional services — responsive cards and safe text wrapping. */
(function(){
  if (window.__bilocostServiceDesignInstalled) return;
  window.__bilocostServiceDesignInstalled = true;

  const style = document.createElement("style");
  style.id = "bilocost-service-design";
  style.textContent = `
    .svc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:14px 0 20px}
    .svc-card{display:flex;flex-direction:column;min-width:0;max-width:100%;overflow:hidden;background:var(--card,#fff);border:1px solid var(--line,#e5e7eb);border-radius:18px;box-shadow:0 5px 18px rgba(20,40,28,.07)}
    .svc-card-media{width:100%;height:148px;display:grid;place-items:center;overflow:hidden;background:var(--panel,#f3f7f4)}
    .svc-card-media img{display:block;width:100%;height:100%;object-fit:cover}
    .svc-card-placeholder{color:var(--pri,#16834a);opacity:.85}
    .svc-card-body{display:flex;flex:1;flex-direction:column;gap:7px;min-width:0;padding:13px}
    .svc-card-title{margin:0;color:var(--text,#18231d);font:700 15px/1.35 'Plus Jakarta Sans',Inter,system-ui,sans-serif;overflow-wrap:anywhere;word-break:normal;white-space:normal}
    .svc-card-meta{display:flex;flex-wrap:wrap;gap:5px 8px;min-width:0;color:var(--mute,#66736b);font:500 11px/1.4 Inter,system-ui,sans-serif;overflow-wrap:anywhere}
    .svc-card-description{margin:0;color:var(--text,#26332b);font:400 12px/1.55 Inter,system-ui,sans-serif;overflow-wrap:anywhere;word-break:normal;white-space:normal;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;overflow:hidden}
    .svc-card-price{margin-top:auto;padding-top:3px;color:var(--pri,#16834a);font:700 14px/1.4 Inter,system-ui,sans-serif;overflow-wrap:anywhere}
    .svc-card-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;margin-top:3px}
    .svc-card-provider{min-width:0;color:var(--mute,#66736b);font:500 10px/1.4 Inter,system-ui,sans-serif;overflow-wrap:anywhere}
    .svc-card-status{flex:none;border-radius:999px;padding:4px 7px;background:var(--mint,#e8f5ed);color:var(--pri,#16834a);font:700 9px/1.2 Inter,system-ui,sans-serif}
    .svc-card-action{align-self:flex-start;max-width:100%;margin-top:5px;white-space:normal;overflow-wrap:anywhere}
    .svc-empty{grid-column:1/-1;padding:24px 16px;border:1px dashed var(--line,#d9e2dc);border-radius:16px;text-align:center;color:var(--mute,#66736b);background:var(--panel,#f7faf8)}
    @media(max-width:360px){.svc-grid{grid-template-columns:minmax(0,1fr);gap:11px}.svc-card-media{height:170px}}
    @media(min-width:700px){.svc-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.svc-card-media{height:160px}}
    .svc-card *{box-sizing:border-box;min-width:0}
  `;
  (document.head || document.documentElement).appendChild(style);

  if (typeof serviceCards === "function") {
    serviceCards = function(){
      const cards = (S.services || []).filter(x => x.status === "ACTIVE");
      if (!cards.length) return '<div class="svc-empty">Aucun service professionnel disponible pour le moment.</div>';
      return '<div class="svc-grid">' + cards.map(x => {
        const title = esc(x.title || "Service professionnel");
        const category = esc(x.category || "Service");
        const commune = esc(x.commune || "RDC");
        const description = esc(x.description || "Contactez ce prestataire pour obtenir plus de détails.");
        const price = x.price ? esc(x.price) + " " + esc(x.currency || "CDF") : "Prix à convenir";
        const provider = esc(x.providerName || "Prestataire Bilocost");
        const photo = x.photo ? '<div class="svc-card-media"><img src="' + esc(x.photo) + '" alt="Photo du service" loading="lazy"></div>' :
          '<div class="svc-card-media"><div class="svc-card-placeholder">' + I("briefcase","",38) + '</div></div>';
        const contact = x.phone ? '<a class="btn out svc-card-action" href="https://wa.me/' + String(x.phone).replace(/[^0-9]/g,"") + '" target="_blank" rel="noopener">Contacter</a>' : '';
        return '<article class="svc-card">' + photo +
          '<div class="svc-card-body"><h3 class="svc-card-title">' + title + '</h3>' +
          '<div class="svc-card-meta"><span>' + category + '</span><span>•</span><span>' + commune + '</span></div>' +
          '<p class="svc-card-description">' + description + '</p>' +
          '<div class="svc-card-price">' + price + '</div>' +
          '<div class="svc-card-footer"><span class="svc-card-provider">' + provider + '</span><span class="svc-card-status">Actif</span></div>' +
          contact + '</div></article>';
      }).join("") + '</div>';
    };
  }

  if (typeof servicePage === "function") {
    servicePage = function(){
      return '<section class="services-page"><h2>Services professionnels</h2>' +
        '<p class="sub">Trouvez des prestataires près de chez vous : coiffure, réparation, plomberie, informatique, photographie et bien plus.</p>' +
        '<button class="btn" data-act="serviceform">Présenter mes services</button>' +
        '<div class="row" style="margin-top:22px"><h3>Prestataires disponibles</h3><span class="tag">' + (S.services || []).filter(x=>x.status==="ACTIVE").length + ' services</span></div>' +
        serviceCards() +
        '<div class="warn" style="margin-top:16px">Abonnement professionnel : 6 USD par mois. Les demandes restent en attente tant que le paiement et l’activation ne sont pas vérifiés.</div></section>';
    };
  }
})();