/* Bilocost — geographic discovery filters for professional services. */
(function(){
  "use strict";
  if(window.__biloServiceGeoFiltersInstalled)return;
  window.__biloServiceGeoFiltersInstalled=true;
  if(typeof servicePage!=="function"||typeof serviceCards!=="function")return;
  const active=()=>((S&&S.services)||[]).filter(x=>x.status==="ACTIVE");
  const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLocaleLowerCase("fr");
  const escGeo=v=>String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const first=(x,keys)=>{for(const k of keys){if(x&&x[k]!=null&&String(x[k]).trim())return String(x[k]).trim();}return "";};
  const fields=x=>({
    province:first(x,["province","provinceName"]),
    commune:first(x,["commune","locality","city","c"]),
    neighborhood:first(x,["neighborhood","quartier","district"]),
    category:first(x,["category","categorie"]),
    title:first(x,["title","name"])
  });
  const options=(key,label,all)=>'<option value="">Toutes les '+label+'</option>'+Array.from(new Set(all.map(x=>fields(x)[key]).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"fr")).map(v=>'<option value="'+escGeo(v)+'">'+escGeo(v)+'</option>').join("");
  const controls=()=>{
    const rows=active(),loc=typeof window.bilocostGetLocation==="function"?window.bilocostGetLocation():{};
    const province=loc.province||"",commune=loc.commune||loc.territory||"";
    return '<section class="bilo-svc-filters" aria-label="Filtres des services">'+
      '<div class="bilo-svc-filter-heading"><b>Affiner ma recherche</b><span>Par activité et localisation</span></div>'+
      '<input class="f" type="search" data-svc-filter="q" placeholder="Ex. : tresses, coiffure, réparation…" aria-label="Rechercher un service">'+
      '<div class="bilo-svc-filter-grid">'+
      '<label>Catégorie<select class="f" data-svc-filter="category"><option value="">Toutes les catégories</option>'+Array.from(new Set(rows.map(x=>fields(x).category).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"fr")).map(v=>'<option value="'+escGeo(v)+'">'+escGeo(v)+'</option>').join("")+'</select></label>'+
      '<label>Province<select class="f" data-svc-filter="province">'+options("province","provinces",rows)+'</select></label>'+
      '<label>Commune / territoire<select class="f" data-svc-filter="commune">'+options("commune","communes et territoires",rows)+'</select></label>'+
      '<label>Quartier<input class="f" data-svc-filter="neighborhood" type="search" placeholder="Nom du quartier"></label>'+
      '<label>Distance<select class="f" data-svc-filter="radius"><option value="">Toutes distances</option><option value="5">Moins de 5 km</option><option value="10">Moins de 10 km</option><option value="25">Moins de 25 km</option><option value="50">Moins de 50 km</option></select></label>'+
      '</div><div class="bilo-svc-filter-actions"><button type="button" class="btn out" data-svc-current>Utiliser ma localisation</button><button type="button" class="lnk" data-svc-reset>Réinitialiser</button></div>'+
      '<p class="bilo-svc-filter-hint">Choisissez une province, une commune ou un quartier pour retrouver les prestataires de cette zone.</p></section>';
  };
  const originalCards=serviceCards;
  serviceCards=function(){
    let html=originalCards();
    const rows=active();
    let index=0;
    html=html.replace(/<article class="svc-card">/g,()=>{
      const x=rows[index++]||{},f=fields(x);
      return '<article class="svc-card" data-svc-province="'+escGeo(f.province)+'" data-svc-commune="'+escGeo(f.commune)+'" data-svc-neighborhood="'+escGeo(f.neighborhood)+'" data-svc-category="'+escGeo(f.category)+'" data-svc-lat="'+escGeo(x.latitude??x.lat??"") +'" data-svc-lng="'+escGeo(x.longitude??x.lng??"") +'" data-svc-search="'+escGeo([f.title,x.description,f.category,f.province,f.commune,f.neighborhood,x.providerName].join(" "))+'">';
    });
    return html;
  };
  const originalPage=servicePage;
  servicePage=function(){
    let html=originalPage();
    const marker='<div class="row" style="margin-top:22px"><h3>Prestataires disponibles</h3>';
    if(html.includes(marker))html=html.replace(marker,controls()+marker);
    return html;
  };
  function apply(root){
    const panel=root.querySelector(".bilo-svc-filters");
    if(!panel)return;
    const value=k=>norm(panel.querySelector('[data-svc-filter="'+k+'"]')?.value);
    const q=value("q"),category=value("category"),province=value("province"),commune=value("commune"),neighborhood=value("neighborhood"),radius=Number(value("radius"))||0;
    const loc=typeof window.bilocostGetLocation==="function"?window.bilocostGetLocation():{};
    const userLat=Number(loc.latitude),userLng=Number(loc.longitude),hasUserCoords=Number.isFinite(userLat)&&Math.abs(userLat)<=90&&Number.isFinite(userLng)&&Math.abs(userLng)<=180;
    const distanceKm=(lat,lng)=>{const rad=n=>n*Math.PI/180,dLat=rad(lat-userLat),dLng=rad(lng-userLng),h=Math.sin(dLat/2)**2+Math.cos(rad(userLat))*Math.cos(rad(lat))*Math.sin(dLng/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));};
    const cards=Array.from(root.querySelectorAll(".svc-card"));
    let visible=0;
    cards.forEach(card=>{
      const match=(!q||norm(card.dataset.svcSearch).includes(q))&&
        (!category||norm(card.dataset.svcCategory)===category)&&
        (!province||norm(card.dataset.svcProvince)===province)&&
        (!commune||norm(card.dataset.svcCommune)===commune)&&
        (!neighborhood||norm(card.dataset.svcNeighborhood).includes(neighborhood))&&
        (!radius||(hasUserCoords&&Number.isFinite(Number(card.dataset.svcLat))&&Number.isFinite(Number(card.dataset.svcLng))&&card.dataset.svcLat!==""&&card.dataset.svcLng!==""&&distanceKm(Number(card.dataset.svcLat),Number(card.dataset.svcLng))<=radius));
      card.hidden=!match;if(match)visible++;
    });
    let empty=root.querySelector(".bilo-svc-filter-empty");
    if(!visible&&cards.length){if(!empty){empty=document.createElement("div");empty.className="svc-empty bilo-svc-filter-empty";empty.textContent="Aucun prestataire ne correspond à ces filtres. Élargissez votre zone de recherche.";root.querySelector(".svc-grid")?.appendChild(empty);}empty.hidden=false;}
    else if(empty)empty.hidden=true;
    const count=root.querySelector(".services-page .row .tag");
    if(count)count.textContent=visible+" service"+(visible>1?"s":"")+" affiché"+(visible>1?"s":"");
  }
  document.addEventListener("input",e=>{if(e.target.closest(".bilo-svc-filters"))apply(document);});
  document.addEventListener("change",e=>{if(e.target.closest(".bilo-svc-filters"))apply(document);});
  document.addEventListener("click",e=>{
    const panel=e.target.closest(".bilo-svc-filters");if(!panel)return;
    if(e.target.closest("[data-svc-reset]")){panel.querySelectorAll("[data-svc-filter]").forEach(el=>el.value="");apply(document);}
    if(e.target.closest("[data-svc-current]")){
      const loc=typeof window.bilocostGetLocation==="function"?window.bilocostGetLocation():{};
      const p=panel.querySelector('[data-svc-filter="province"]'),c=panel.querySelector('[data-svc-filter="commune"]');
      if(p)p.value=loc.province||"";
      if(c)c.value=loc.commune||loc.territory||"";
      apply(document);
    }
  });
  const css=document.createElement("style");
  css.textContent='.bilo-svc-filters{margin:18px 0;padding:16px;border:1px solid var(--line);border-radius:17px;background:var(--card);display:grid;gap:12px}.bilo-svc-filter-heading{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.bilo-svc-filter-heading b{font-size:15px}.bilo-svc-filter-heading span,.bilo-svc-filter-hint{font-size:11px;color:var(--mute)}.bilo-svc-filter-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.bilo-svc-filter-grid label{display:grid;gap:5px;font-size:11px;font-weight:700;color:var(--ink)}.bilo-svc-filter-grid .f,.bilo-svc-filters>.f{width:100%;min-width:0;box-sizing:border-box}.bilo-svc-filter-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.bilo-svc-filter-hint{margin:0}.svc-card[hidden]{display:none!important}.bilo-svc-filter-empty[hidden]{display:none!important}@media(max-width:420px){.bilo-svc-filters{padding:12px}.bilo-svc-filter-grid{grid-template-columns:minmax(0,1fr)}.bilo-svc-filter-heading{align-items:flex-start;flex-direction:column;gap:3px}}';
  document.head.appendChild(css);
})();