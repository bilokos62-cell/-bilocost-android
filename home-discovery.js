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
    // No active provider: show only the section heading. Avoid rendering an empty-state
    // card whose inherited layout rules can collapse its text on narrow/tablet viewports.
    if(!cards)return '';
    return '<section class="bilo-home-services" aria-label="Services de proximité"><div class="bilo-home-section-head"><div><span class="bilo-section-kicker">AUTOUR DE VOUS</span><h2>Services de proximité</h2><p>Découvrez les professionnels présents sur Bilocost</p></div><button class="lnk" data-t="services">Voir tout →</button></div>'+
      '<div class="bilo-services-rail">'+cards+'</div></section>';
  };
  V.home=function(){
    let html=originalHome();
    const hero=html.indexOf('<section class="hero">');
    if(hero>=0){
      const end=html.indexOf("</section>",hero);
      if(end>=0){
        let heroHtml=html.slice(hero,end+10);
        heroHtml=heroHtml.replace('<section class="hero">','<section class="hero bilo-hero-reference">');
        const heroArt='<div class="bilo-hero-art" aria-hidden="true"><img src="/assets/bilocost-hero-2026.webp" alt="" decoding="async" fetchpriority="high"></div><button type="button" class="bilo-hero-click" data-t="search" aria-label="Découvrir les annonces"></button>';
        heroHtml=heroHtml.replace('</section>',heroArt+'</section>');
        html=html.slice(0,hero)+heroHtml+html.slice(end+10);
      }
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

  style.textContent += `
    /* Rebuild the home discovery hero to match the approved Bilocost green campaign banner. */
    #view .bilo-hero-reference{
      position:relative!important;isolation:isolate;display:flex!important;align-items:center!important;
      box-sizing:border-box!important;min-height:250px!important;padding:28px clamp(22px,4vw,48px)!important;
      overflow:hidden!important;border:1.5px solid #16d982!important;border-radius:26px!important;
      background:radial-gradient(ellipse at 84% 8%,rgba(47,255,158,.42),transparent 36%),
        radial-gradient(ellipse at 5% 100%,rgba(0,255,156,.28),transparent 38%),
        linear-gradient(112deg,#005b39 0%,#008d50 48%,#003b38 100%)!important;
      box-shadow:0 14px 34px rgba(0,35,25,.28),inset 0 0 0 1px rgba(255,255,255,.10)!important;
    }
    #view .bilo-hero-reference:before,#view .bilo-hero-reference:after{
      content:"";position:absolute;z-index:-1;pointer-events:none;border:1px solid rgba(98,255,185,.32);
      border-radius:50%;transform:rotate(-20deg)
    }
    #view .bilo-hero-reference:before{width:54%;height:180%;right:-12%;top:-105%;box-shadow:0 0 0 14px rgba(36,245,138,.05),0 0 0 30px rgba(36,245,138,.04)}
    #view .bilo-hero-reference:after{width:42%;height:130%;left:-25%;bottom:-105%;box-shadow:0 0 0 18px rgba(36,245,138,.05)}
    #view .bilo-hero-reference>*:not(.bilo-hero-art){position:relative;z-index:2;max-width:58%;min-width:0}
    #view .bilo-hero-reference h1{max-width:620px!important;color:#fff!important;font-size:clamp(25px,3.3vw,42px)!important;font-weight:850!important;line-height:1.12!important;letter-spacing:-.035em!important;text-shadow:0 2px 12px rgba(0,0,0,.16)}
    #view .bilo-hero-reference p{max-width:580px!important;color:#e3fff1!important;font-size:clamp(14px,1.5vw,18px)!important;line-height:1.45!important}
    #view .bilo-hero-reference .btn,#view .bilo-hero-reference button{
      min-height:48px!important;padding:12px 24px!important;border:1px solid #fff!important;border-radius:16px!important;
      background:linear-gradient(180deg,#fff,#e8fff3)!important;color:#064b32!important;font-weight:850!important;
      box-shadow:0 7px 20px rgba(0,0,0,.16)!important
    }
    #view .bilo-hero-art{position:absolute;z-index:1;right:1.5%;top:2%;bottom:2%;width:46%;display:flex;align-items:center;justify-content:center;pointer-events:none}
    #view .bilo-hero-art svg{display:block;width:100%;height:100%;max-height:290px;overflow:visible}
    @media(max-width:600px){
      #view .bilo-hero-reference{min-height:230px!important;padding:20px!important;border-radius:20px!important}
      #view .bilo-hero-reference>*:not(.bilo-hero-art){max-width:68%}
      #view .bilo-hero-reference h1{font-size:clamp(21px,6vw,30px)!important}
      #view .bilo-hero-reference p{font-size:12px!important}
      #view .bilo-hero-art{right:-5%;width:48%;opacity:.9}
      #view .bilo-hero-reference .btn,#view .bilo-hero-reference button{min-height:42px!important;padding:9px 15px!important;font-size:13px!important}
    }
    @media(prefers-reduced-motion:reduce){#view .bilo-hero-reference{scroll-behavior:auto}}
  `;

  /* Approved full-width campaign artwork; preserve the existing search action. */
  style.textContent += `
    #view .bilo-hero-reference{position:relative!important;display:block!important;box-sizing:border-box!important;width:100%!important;min-height:0!important;height:auto!important;aspect-ratio:1536/446!important;padding:0!important;overflow:hidden!important;border:0!important;border-radius:24px!important;background:#006b43!important;box-shadow:0 10px 28px rgba(0,35,25,.22)!important}
    #view .bilo-hero-reference:before,#view .bilo-hero-reference:after{display:none!important}
    #view .bilo-hero-reference>*:not(.bilo-hero-art):not(.bilo-hero-click){display:none!important}
    #view .bilo-hero-art{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;opacity:1!important}
    #view .bilo-hero-art img{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important}
    #view .bilo-hero-reference button.bilo-hero-click{position:absolute!important;z-index:5!important;left:5.8%!important;top:69%!important;width:19%!important;height:21%!important;min-height:0!important;padding:0!important;margin:0!important;border:0!important;border-radius:18px!important;background:transparent!important;background-color:transparent!important;color:transparent!important;border:0!important;box-shadow:none!important;appearance:none!important;-webkit-appearance:none!important;cursor:pointer!important}
    #view .bilo-hero-click:focus-visible{outline:3px solid #fff!important;outline-offset:3px!important}
    @media(max-width:600px){#view .bilo-hero-reference{border-radius:16px!important}.bilo-hero-click{border-radius:12px!important}}
  `;
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