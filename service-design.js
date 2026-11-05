/* Bilocost professional services — responsive cards and safe text wrapping. */
(function(){
  if (window.__bilocostServiceDesignInstalled) return;
  window.__bilocostServiceDesignInstalled = true;

  /* Give the Partners heading and its ad action their own horizontal strip. */
  if (typeof adSlots === "function" && !window.__bilocostPartnerNavPatched) {
    const originalAdSlots = adSlots;
    adSlots = function(){
      return originalAdSlots().replace(
        '<div class="row"><h3>Partenaires Bilocost</h3>',
        '<div class="row partner-nav"><h3>Partenaires Bilocost</h3>'
      );
    };
    window.__bilocostPartnerNavPatched = true;
  }

  const style = document.createElement("style");
  style.id = "bilocost-service-design";
  style.textContent = `
    .partner-nav{
      display:flex!important;flex-wrap:nowrap!important;align-items:center;
      justify-content:space-between;gap:12px!important;max-width:100%;
      overflow-x:auto;overflow-y:hidden;padding:3px 1px 8px;
      -webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;
      scrollbar-width:none;
    }
    .partner-nav::-webkit-scrollbar{display:none}
    .partner-nav>h3{flex:0 0 auto;white-space:nowrap;margin:0}
    .partner-nav>.lnk{flex:0 0 auto;white-space:nowrap}
    /* Horizontal, touch-scrollable home shortcuts */
    .two[style*="margin:14px 0"]{
      display:flex!important;flex-wrap:nowrap!important;align-items:stretch;
      gap:10px!important;max-width:100%;overflow-x:auto;overflow-y:hidden;
      padding:2px 1px 10px;margin:14px 0!important;
      -webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;
      scrollbar-width:none;scroll-snap-type:x proximity;
    }
    .two[style*="margin:14px 0"]::-webkit-scrollbar{display:none}
    .two[style*="margin:14px 0"]>.btn{
      display:inline-flex;align-items:center;justify-content:center;
      flex:0 0 auto;width:auto;max-width:none;min-width:max-content;
      white-space:nowrap;scroll-snap-align:start;padding:11px 16px;
    }
    .row:has(>h3){gap:10px;flex-wrap:wrap}
    .row:has(>h3)>h3{min-width:0;overflow-wrap:anywhere}
    .row:has(>h3)>.lnk{flex:0 0 auto;white-space:nowrap}
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

  /* Locate the real rendered controls instead of relying on inline HTML selectors. */
  const applyBilocostNavigation = () => {
    const root = document.getElementById("view") || document;
    const serviceButton = Array.from(root.querySelectorAll('button[data-t="services"]'))
      .find(el => el.textContent.trim().includes("Trouver un professionnel"));
    if (serviceButton && serviceButton.parentElement) {
      serviceButton.parentElement.classList.add("bilocost-horizontal-nav");
    }

    const partnerTitle = Array.from(root.querySelectorAll("h3"))
      .find(el => el.textContent.trim() === "Partenaires Bilocost");
    if (partnerTitle && partnerTitle.parentElement) {
      partnerTitle.parentElement.classList.add("partner-nav");
    }
  };

  style.textContent += `
    .bilocost-horizontal-nav{
      display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;
      align-items:stretch;gap:10px!important;width:100%!important;max-width:100%!important;
      min-width:0!important;box-sizing:border-box;overflow-x:auto!important;
      overflow-y:hidden!important;padding:2px 2px 10px!important;
      -webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;
      scrollbar-width:none;touch-action:pan-x;
    }
    .bilocost-horizontal-nav::-webkit-scrollbar{display:none}
    .bilocost-horizontal-nav>button{
      flex:0 0 auto!important;width:max-content!important;max-width:none!important;
      min-width:max-content!important;white-space:nowrap!important;
    }
    .partner-nav{
      display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;
      align-items:center;width:100%!important;max-width:100%!important;min-width:0!important;
      box-sizing:border-box;overflow-x:auto!important;overflow-y:hidden!important;
      justify-content:flex-start!important;gap:14px!important;
      -webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;
      scrollbar-width:none;touch-action:pan-x;
    }
    .partner-nav::-webkit-scrollbar{display:none}
    .partner-nav>h3,.partner-nav>.lnk{
      flex:0 0 auto!important;white-space:nowrap!important;margin:0!important;
    }
  `;

  applyBilocostNavigation();
  const navigationObserver = new MutationObserver(applyBilocostNavigation);
  navigationObserver.observe(document.documentElement,{childList:true,subtree:true});

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