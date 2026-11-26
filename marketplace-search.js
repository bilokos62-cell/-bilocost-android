/* Bilocost — unified search across products and active professional services. */
(function(){
  "use strict";
  if(window.__biloGlobalSearchInstalled||typeof V==="undefined"||typeof V.search!=="function")return;
  window.__biloGlobalSearchInstalled=true;
  S.marketMode=S.marketMode||"all";
  const originalSearch=V.search;
  const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("fr").trim();
  const tabs=()=>'<div class="bilo-market-tabs" role="group" aria-label="Type de résultats"><button type="button" data-market-mode="all" aria-pressed="'+(S.marketMode==="all")+'">Tout</button><button type="button" data-market-mode="products" aria-pressed="'+(S.marketMode==="products")+'">Produits</button><button type="button" data-market-mode="services" aria-pressed="'+(S.marketMode==="services")+'">Services</button></div>';
  const services=()=>{
    const q=norm(S.q);
    const rows=(S.services||[]).filter(x=>x.status==="ACTIVE"&&(!q||norm([x.title,x.description,x.category,x.commune,x.providerName].join(" ")).includes(q)));
    if(!rows.length)return '<div class="empty">Aucun service correspondant pour le moment.</div>';
    return '<div class="bilo-global-services">'+rows.map(x=>'<article class="seller bilo-global-service"><div class="lic">'+I("briefcase","",22)+'</div><div class="bilo-global-service-copy"><b>'+esc(x.title||"Service professionnel")+'</b><div class="sub">'+esc(x.category||"Service")+' · '+esc(x.commune||"RDC")+'</div><p class="sub">'+esc(x.description||"")+'</p><b>'+(x.price?esc(x.price)+" "+esc(x.currency||"CDF"):"Prix à convenir")+'</b><div class="sub">'+esc(x.providerName||"Prestataire Bilocost")+'</div>'+(x.phone?'<a class="btn out" href="https://wa.me/'+String(x.phone).replace(/[^0-9]/g,"")+'" target="_blank" rel="noopener">Contacter</a>':"")+'</div>'+(x.photo?'<img src="'+esc(x.photo)+'" alt="" loading="lazy">':"")+'</article>').join("")+'</div>';
  };
  V.search=function(){
    if(S.marketMode==="services")return '<h2 style="margin-bottom:12px">Services professionnels</h2><div class="search"><input id="q" type="search" placeholder="Rechercher un produit, un service…" value="'+esc(S.q)+'" aria-label="Rechercher"></div>'+tabs()+services();
    let html=originalSearch();
    const start=html.indexOf('<div class="search">');
    const close=start<0?-1:html.indexOf('</div>',start);
    if(close>=0)html=html.slice(0,close+6)+tabs()+html.slice(close+6);
    if(S.marketMode==="all"&&S.q)html+='<section class="bilo-global-service-section"><div class="row"><h3>Services correspondants</h3><button class="lnk" data-market-mode="services">Voir tout</button></div>'+services()+'</section>';
    return html;
  };
  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-market-mode]");
    if(!b)return;
    S.marketMode=b.dataset.marketMode||"all";
    if(S.tab==="search")render();
  });
  const style=document.createElement("style");
  style.id="bilo-global-search-style";
  style.textContent=".bilo-market-tabs{display:flex;gap:8px;margin:0 0 14px}.bilo-market-tabs button{padding:9px 15px;border:1px solid var(--line);border-radius:999px;background:var(--panel);color:var(--ink);font:600 13px Inter}.bilo-market-tabs button[aria-pressed=true]{background:var(--pri);border-color:var(--pri);color:#fff}.bilo-global-service-section{margin:20px 0}.bilo-global-services{display:grid;gap:10px}.bilo-global-service{min-width:0}.bilo-global-service-copy{flex:1;min-width:0}.bilo-global-service>img{width:64px;height:64px;object-fit:cover;border-radius:12px}";
  document.head.appendChild(style);
})();