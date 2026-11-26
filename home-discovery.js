/* Bilocost home discovery enhancements: categories, ranked trends, services and partner carousel. */
(function(){
  "use strict";
  if(window.__bilocostHomeDiscoveryInstalled)return;
  window.__bilocostHomeDiscoveryInstalled=true;
  if(typeof V==="undefined"||!V.home)return;
  const originalHome=V.home;
  const categoryShortcuts=()=>{
    return '<section class="bilo-home-categories" aria-label="Accès rapide aux catégories">'+
      '<div class="bilo-home-section-head"><div><h2>Explorer les catégories</h2><p>Accédez directement à vos univers préférés</p></div><button class="lnk" data-t="search">Tout voir →</button></div>'+
      '<div class="bilo-category-shortcuts">'+CATS.slice(1).map(([name,icon])=>{
        const count=items.filter(item=>item.cat===name&&!item.sold).length;
        return '<button type="button" class="bilo-category-shortcut" data-cat="'+esc(name)+'" aria-label="Voir la catégorie '+esc(name)+'"><span class="bilo-category-icon">'+I(icon,"",25)+'</span><b>'+esc(name)+'</b><small>'+count+' article'+(count>1?"s":"")+'</small></button>';
      }).join("")+'</div></section>';
  };
  const trendingSection=()=>{
    const ranked=typeof list==="function"?list().slice(0,5):[];
    if(!ranked.length)return "";
    return '<section class="bilo-home-trending" aria-label="Tendances du moment"><div class="bilo-home-section-head"><div><span class="bilo-section-kicker">À DÉCOUVRIR</span><h2>Tendances du moment</h2><p>Une sélection issue du classement actuel des annonces disponibles</p></div><button class="lnk" data-t="search">Voir tout →</button></div><div class="bilo-trending-rail">'+ranked.map(item=>cardH(item)).join("")+'</div></section>';
  };
  const servicesSection=()=>{
    const active=(S.services||[]).filter(item=>item.status==="ACTIVE").slice(0,4);
    const cards=active.map(item=>
      '<article class="bilo-service-tile">'+
        (item.photo?'<img src="'+esc(item.photo)+'" alt="" loading="lazy">':'<span class="bilo-service-icon">'+I("briefcase","",25)+'</span>')+
        '<div class="bilo-service-info"><b>'+esc(item.title||"Service professionnel")+'</b><small>'+esc(item.category||"Service")+' · '+esc(item.commune||"RDC")+'</small><span>'+(item.price?esc(item.price)+" "+esc(item.currency||"CDF"):"Prix à convenir")+'</span></div>'+
      '</article>'
    ).join("");
    return '<section class="bilo-home-services" aria-label="Services de proximité"><div class="bilo-home-section-head"><div><span class="bilo-section-kicker">AUTOUR DE VOUS</span><h2>Services de proximité</h2><p>Découvrez les professionnels présents sur Bilocost</p></div><button class="lnk" data-t="services">Voir tout →</button></div>'+
      (cards?'<div class="bilo-services-rail">'+cards+'</div>':'<div class="bilo-service-invite bilo-service-empty"><button type="button" class="btn out" data-t="services" aria-label="Découvrir les services de proximité">Découvrir les services</button></div>')+
      '</section>';
  };
  V.home=function(){
    let html=originalHome();
    const hero=html.indexOf('<section class="hero">');
    if(hero>=0){
      const end=html.indexOf("</section>",hero);
      if(end>=0)html=html.slice(0,end+10)+categoryShortcuts()+html.slice(end+10);
    }
    const popular='<div class="row"><div><h2>Produits populaires</h2>';
    if(html.includes(popular))html=html.replace(popular,trendingSection()+servicesSection()+popular);
    return html;
  };
  const style=document.createElement("style");
  style.id="bilocost-home-discovery-style";
  style.textContent=[
    ".bilo-home-categories,.bilo-home-trending,.bilo-home-services{margin:24px 0 28px;min-width:0}",
    ".bilo-home-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:0 0 13px;min-width:0}",
    ".bilo-home-section-head h2{margin:3px 0 4px;font-size:clamp(18px,2vw,23px);letter-spacing:-.035em}",
    ".bilo-home-section-head p{margin:0;color:var(--mute);font-size:13px;line-height:1.45}",
    ".bilo-home-section-head>.lnk{flex:0 0 auto;white-space:nowrap;padding:4px 0}",
    ".bilo-section-kicker{font-size:10px;font-weight:850;letter-spacing:.12em;color:var(--pri)}",
    ".bilo-category-shortcuts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}",
    ".bilo-category-shortcut{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-width:0;min-height:112px;padding:12px 6px;border:1px solid var(--line);border-radius:17px;background:var(--card);color:var(--ink);text-align:center;box-shadow:0 4px 15px rgba(15,23,42,.045)}",
    ".bilo-category-shortcut:active{transform:scale(.98)}",
    ".bilo-category-icon,.bilo-service-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:15px;background:var(--mint);color:var(--pri)}",
    ".bilo-category-shortcut b{font-size:12px;line-height:1.25;overflow-wrap:anywhere}",
    ".bilo-category-shortcut small{font-size:10px;color:var(--mute)}",
    ".bilo-trending-rail,.bilo-services-rail{display:flex;gap:13px;overflow-x:auto;overflow-y:hidden;padding:2px 2px 12px;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none}",
    ".bilo-trending-rail::-webkit-scrollbar,.bilo-services-rail::-webkit-scrollbar{display:none}",
    ".bilo-trending-rail>.card{flex:0 0 clamp(190px,26vw,245px);width:clamp(190px,26vw,245px);scroll-snap-align:start}",
    ".bilo-service-tile{display:flex;align-items:center;gap:12px;flex:0 0 min(310px,82vw);min-width:0;padding:12px;border:1px solid var(--line);border-radius:17px;background:var(--card);scroll-snap-align:start}",
    ".bilo-service-tile>img{width:66px;height:66px;flex:0 0 66px;object-fit:cover;border-radius:13px}",
    ".bilo-service-tile .bilo-service-icon{width:66px;height:66px;flex:0 0 66px;border-radius:13px}",
    ".bilo-service-info{display:flex;flex-direction:column;gap:5px;min-width:0}",
    ".bilo-service-info b{font-size:13px;line-height:1.3;overflow-wrap:anywhere}",
    ".bilo-service-info small{font-size:11px;color:var(--mute)}",
    ".bilo-service-info>span{font-size:12px;color:var(--pri);font-weight:800}",
    ".bilo-service-invite{display:flex;align-items:center;gap:13px;padding:15px;border:1px dashed var(--line);border-radius:18px;background:var(--panel)}",
    ".bilo-service-invite>div{flex:1;min-width:0}",
    ".bilo-service-invite b{font-size:13px}",
    ".bilo-service-invite p{margin:4px 0 0;color:var(--mute);font-size:12px}",
    ".bilo-service-invite .btn{flex:0 0 auto;min-width:0}",
    ".brand-ad-rail{scroll-snap-type:x mandatory;scroll-behavior:smooth}.brand-ad-card{scroll-snap-align:start}",
    "@media(max-width:420px){.bilo-category-shortcuts{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.bilo-category-shortcut{min-height:100px;padding:9px 3px;border-radius:14px}.bilo-category-icon{width:42px;height:42px}.bilo-category-shortcut b{font-size:10px}.bilo-category-shortcut small{font-size:9px}.bilo-home-section-head p{font-size:11px}.bilo-service-invite{flex-wrap:wrap}.bilo-service-invite .btn{width:100%}}",
    "@media(min-width:700px){.bilo-category-shortcuts{grid-template-columns:repeat(8,minmax(0,1fr));gap:13px}.bilo-category-shortcut{min-height:126px}.bilo-trending-rail>.card{flex-basis:230px;width:230px}.bilo-service-tile{flex-basis:300px}}",
    "@media(prefers-reduced-motion:reduce){.brand-ad-rail{scroll-behavior:auto}}",
    "/* Fix tablet/mobile service invitation: reserve a real text column and place CTA on its own row. */",
    ".bilo-service-invite{display:grid;grid-template-columns:48px minmax(0,1fr);align-items:center;gap:12px;min-width:0}",
    ".bilo-service-invite>span{grid-column:1;grid-row:1;width:48px;height:48px;flex:none}",
    ".bilo-service-invite>div{grid-column:2;grid-row:1;min-width:0;width:auto;flex:none}",
    ".bilo-service-invite .btn{grid-column:1/-1;grid-row:2;width:100%;min-width:0;max-width:100%;white-space:normal}",
    ".bilo-service-invite p,.bilo-service-invite b{display:block;max-width:100%;white-space:normal;overflow-wrap:anywhere;word-break:normal}",
    "@media(min-width:700px){.bilo-service-invite{grid-template-columns:56px minmax(0,1fr) minmax(150px,220px)}.bilo-service-invite>span{width:56px;height:56px}.bilo-service-invite .btn{grid-column:3;grid-row:1;width:100%}}",
    "/* Hard override for the service empty state: prevent inherited flex/grid rules from collapsing its copy. */",
    "#view .bilo-home-services .bilo-service-invite{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;overflow:visible!important}",
    "#view .bilo-home-services .bilo-service-invite>div{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;flex:none!important;grid-column:auto!important;white-space:normal!important}",
    "#view .bilo-home-services .bilo-service-invite>div b,#view .bilo-home-services .bilo-service-invite>div p{display:block!important;width:100%!important;max-width:100%!important;white-space:normal!important;overflow-wrap:break-word!important;word-break:normal!important}",
    "#view .bilo-home-services .bilo-service-invite>.btn{display:block!important;position:static!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:14px 0 0!important;white-space:normal!important}"
  ].join("\n");
  (document.head||document.documentElement).appendChild(style);
  const attachAdCarousel=()=>{
    document.querySelectorAll("#view .brand-ad-section .brand-ad-rail").forEach(rail=>{
      if(rail.dataset.biloAutoCarousel==="1")return;
      rail.dataset.biloAutoCarousel="1";
      const cards=rail.querySelectorAll(".brand-ad-card");
      if(cards.length<2||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
      const timer=window.setInterval(()=>{
        if(!rail.isConnected){window.clearInterval(timer);return}
        if(rail.matches(":hover")||rail.contains(document.activeElement)||rail.dataset.paused==="1")return;
        const at=rail.scrollLeft+rail.clientWidth;
        const end=rail.scrollWidth-rail.clientWidth;
        rail.scrollTo({left:at>=end-8?0:at,behavior:"smooth"});
      },4800);
      rail.addEventListener("pointerdown",()=>{rail.dataset.paused="1"},{passive:true});
      rail.addEventListener("pointerup",()=>{window.setTimeout(()=>{rail.dataset.paused="0"},1600)},{passive:true});
      rail.addEventListener("focusin",()=>{rail.dataset.paused="1"});
      rail.addEventListener("focusout",()=>{rail.dataset.paused="0"});
    });
  };
  attachAdCarousel();
  const root=document.getElementById("view");
  if(root&&window.MutationObserver){
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;queued=true;
      requestAnimationFrame(()=>{queued=false;attachAdCarousel()});
    }).observe(root,{childList:true,subtree:true});
  }
})();