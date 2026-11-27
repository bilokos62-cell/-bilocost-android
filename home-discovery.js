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
      (cards?'<div class="bilo-services-rail">'+cards+'</div>':'<div class="bilo-service-invite"><span class="bilo-service-icon">'+"<svg viewBox=\"0 0 24 24\" width=\"26\" height=\"26\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"7\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2\"/></svg>"+'</span><div><b>Vous proposez un service ?</b><p>Présentez votre activité à la communauté Bilocost.</p></div><button class="btn out" data-t="services">Découvrir</button></div>')+
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
    ".bilo-service-invite>.bilo-service-icon{font-size:0!important;position:relative!important;display:grid!important;place-items:center!important}",
    ".bilo-service-invite>.bilo-service-icon svg{display:block!important;visibility:visible!important;opacity:1!important;width:27px!important;height:27px!important;color:var(--pri)!important;stroke:currentColor!important}",
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
    ".bilo-service-invite{display:grid!important;grid-template-columns:48px minmax(0,1fr) auto!important;align-items:center!important;gap:13px!important;width:100%!important;min-width:0!important;box-sizing:border-box!important;overflow:hidden!important;writing-mode:horizontal-tb!important;text-orientation:mixed!important}",
    ".bilo-service-invite>.bilo-service-icon{display:grid!important;grid-column:1!important;grid-row:1!important;width:48px!important;min-width:48px!important;height:48px!important}",
    ".bilo-service-invite>div{display:block!important;grid-column:2!important;grid-row:1!important;width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important;writing-mode:horizontal-tb!important;text-orientation:mixed!important;white-space:normal!important}",
    ".bilo-service-invite>div>b,.bilo-service-invite>div>p{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;white-space:normal!important;writing-mode:horizontal-tb!important;text-orientation:mixed!important;word-break:normal!important;overflow-wrap:break-word!important;line-height:1.45!important}",
    ".bilo-service-invite>.btn{display:inline-flex!important;grid-column:3!important;grid-row:1!important;justify-self:end!important;align-self:center!important;width:auto!important;min-width:max-content!important;max-width:100%!important;white-space:nowrap!important}",
    ".bilo-service-invite>div{flex:1;min-width:0}",
    ".bilo-service-invite>div>b{display:block!important;margin:0!important;font-family:inherit!important;font-size:14px!important;font-weight:750!important;line-height:1.3!important;letter-spacing:-.02em!important;color:var(--ink)!important}",
    ".bilo-service-invite>div>p{display:block!important;margin:5px 0 0!important;font-family:inherit!important;font-size:13px!important;font-weight:400!important;line-height:1.45!important;letter-spacing:0!important;color:var(--mute)!important}",
    ".bilo-service-invite .btn{flex:0 0 auto;min-width:0}",
    ".brand-ad-rail{scroll-snap-type:x mandatory;scroll-behavior:smooth}.brand-ad-card{scroll-snap-align:start}",
    "@media(max-width:420px){.bilo-category-shortcuts{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.bilo-category-shortcut{min-height:100px;padding:9px 3px;border-radius:14px}.bilo-category-icon{width:42px;height:42px}.bilo-category-shortcut b{font-size:10px}.bilo-category-shortcut small{font-size:9px}.bilo-home-section-head p{font-size:11px}.bilo-service-invite{flex-wrap:wrap}.bilo-service-invite .btn{width:100%}}",
    "@media(min-width:700px){.bilo-category-shortcuts{grid-template-columns:repeat(8,minmax(0,1fr));gap:13px}.bilo-category-shortcut{min-height:126px}.bilo-trending-rail>.card{flex-basis:230px;width:230px}.bilo-service-tile{flex-basis:300px}}",
    "@media(prefers-reduced-motion:reduce){.brand-ad-rail{scroll-behavior:auto}}",
    "/* Final tablet/mobile correction for the service invitation card */",
    ".bilo-service-invite{display:grid!important;grid-template-columns:48px minmax(0,1fr) 132px!important;grid-template-rows:auto!important;align-items:center!important;column-gap:12px!important;row-gap:10px!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;overflow:hidden!important}",
    ".bilo-service-invite>.bilo-service-icon{grid-column:1!important;grid-row:1!important;width:48px!important;height:48px!important;min-width:48px!important}",
    ".bilo-service-invite>div{grid-column:2!important;grid-row:1!important;display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important}",
    ".bilo-service-invite>div>b,.bilo-service-invite>div>p{display:block!important;width:100%!important;max-width:100%!important;white-space:normal!important;word-break:normal!important;overflow-wrap:break-word!important;writing-mode:horizontal-tb!important;text-orientation:mixed!important}",
    ".bilo-service-invite>.btn{grid-column:3!important;grid-row:1!important;display:inline-flex!important;justify-content:center!important;align-items:center!important;width:132px!important;min-width:132px!important;max-width:132px!important;box-sizing:border-box!important;white-space:nowrap!important}",
    "@media(max-width:520px){.bilo-service-invite{grid-template-columns:42px minmax(0,1fr)!important}.bilo-service-invite>.bilo-service-icon{grid-column:1!important;grid-row:1!important;width:42px!important;height:42px!important;min-width:42px!important}.bilo-service-invite>div{grid-column:2!important;grid-row:1!important}.bilo-service-invite>.btn{grid-column:1/-1!important;grid-row:2!important;width:100%!important;min-width:0!important;max-width:100%!important}}",
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