/* Bilocost — RDC location hierarchy.
 * Source: Open Admin Data, DR Congo (CC BY 4.0), with Kinshasa's 24 communes listed explicitly.
 * The selector remains usable with manual entry if the remote reference is unavailable.
 */
(function(){
  if(window.__biloNationalLocationInstalled) return;
  window.__biloNationalLocationInstalled = true;
  const STORE="bilocost_location_v2";
  const CACHE="bilocost_geo_reference_v1";
  const provinceFallback=[
    "Bas-Uélé","Équateur","Haut-Katanga","Haut-Lomami","Haut-Uélé","Ituri",
    "Kasaï","Kasaï-Central","Kasaï-Oriental","Kinshasa","Kongo Central",
    "Kwango","Kwilu","Lomami","Lualaba","Mai-Ndombe","Maniema","Mongala",
    "Nord-Kivu","Nord-Ubangi","Sankuru","Sud-Kivu","Sud-Ubangi","Tanganyika",
    "Tshopo","Tshuapa"
  ];
  const kinshasaCommunes=[
    "Bandalungwa","Barumbu","Bumbu","Gombe","Kalamu","Kasa-Vubu",
    "Kimbanseke","Kinshasa","Kintambo","Kisenso","Lemba","Limete",
    "Lingwala","Makala","Maluku","Masina","Matete","Mont-Ngafula",
    "Ndjili","Ngaba","Ngaliema","Ngiri-Ngiri","Nsele","Selembao"
  ];
  const read=(k,fallback)=>{try{return JSON.parse(localStorage.getItem(k)||"null")||fallback}catch(_){return fallback}};
  const saved=read(STORE,{});
  const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let reference=null;
  const getName=x=>x?.name_local||x?.name?.local||x?.name_en||x?.name?.en||"";
  const getId=x=>String(x?.id||"");
  const getParent=x=>String(x?.parent_id||x?.parent?.id||"");
  const sortNames=a=>a.slice().sort((x,y)=>getName(x).localeCompare(getName(y),"fr"));
  async function loadReference(){
    const cached=read(CACHE,null);
    if(cached?.savedAt&&Date.now()-cached.savedAt<30*86400000&&cached.data?.province?.length)return cached.data;
    try{
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),8000);
      let response;
      try{response=await fetch("https://api.openadmindata.org/api/v1/countries/cd.json",{headers:{Accept:"application/json"},signal:controller.signal});}
      finally{clearTimeout(timeout);}
      if(!response.ok)throw new Error("Référentiel indisponible");
      const payload=await response.json();
      const data=payload.data||payload;
      if(!Array.isArray(data.province)||!Array.isArray(data.territory)||!Array.isArray(data.sector))throw new Error("Format géographique non reconnu");
      localStorage.setItem(CACHE,JSON.stringify({savedAt:Date.now(),data}));
      return data;
    }catch(error){return cached?.data||null;}
  }
  function setLabel(){
    const province=saved.province||"RDC";
    const local=saved.commune||saved.territory||"Choisir une localité";
    const label=document.getElementById("communeLbl");
    if(label)label.textContent=saved.province?(saved.province==="Kinshasa"&&saved.commune?saved.commune:local):"RDC";
    const chip=document.querySelector("header .commune");
    if(chip)chip.title=saved.province?[province,saved.territory,saved.commune].filter(Boolean).join(" · "):"Choisir votre province et votre localité";
  }
  function open(){
    if(document.getElementById("biloLocationOverlay"))return;
    const overlay=document.createElement("div");
    overlay.id="biloLocationOverlay";
    overlay.style.cssText="position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center;padding:12px";
    overlay.innerHTML='<section role="dialog" aria-modal="true" aria-label="Choisir votre localisation" style="width:min(100%,520px);max-height:90vh;overflow:auto;background:var(--card,#fff);color:var(--text,#18231d);border-radius:22px;padding:20px;box-shadow:0 15px 50px #0004"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h2 style="margin:0;font-size:20px">Votre localisation</h2><button type="button" data-loc-close aria-label="Fermer" style="border:0;background:transparent;font-size:24px">×</button></div><p class="sub" style="margin:8px 0 14px">Sélectionnez votre province, puis votre ville ou territoire et votre commune ou entité locale.</p><label for="biloProvince" style="display:block;margin:12px 0 6px;font-weight:700">1. Province</label><select id="biloProvince" class="f" style="width:100%;padding:13px;border-radius:12px"><option value="">Chargement des provinces…</option></select><label for="biloTerritory" style="display:block;margin:12px 0 6px;font-weight:700">2. Ville ou territoire</label><select id="biloTerritory" class="f" style="width:100%;padding:13px;border-radius:12px" disabled><option value="">Choisissez d’abord une province</option></select><div id="biloLocalWrap"><label for="biloLocal" id="biloLocalLabel" style="display:block;margin:12px 0 6px;font-weight:700">3. Commune, secteur ou chefferie</label><select id="biloLocal" class="f" style="width:100%;padding:13px;border-radius:12px" disabled><option value="">Choisissez d’abord une ville ou un territoire</option></select></div><label for="biloManual" style="display:block;margin:12px 0 6px;font-weight:700">Localité / quartier (facultatif)</label><input id="biloManual" class="f" style="width:100%;padding:13px;border-radius:12px" placeholder="Ex. : Kinsuka, quartier…" value="'+esc(saved.neighborhood||"")+'"><p class="sub" id="biloGeoNotice" style="font-size:11px;margin-top:9px">Données géographiques : Open Admin Data (CC BY 4.0). Si votre localité manque, indiquez-la dans le champ libre.</p><button type="button" data-loc-save class="btn" style="width:100%;margin-top:14px">Enregistrer ma localisation</button></section>';
    document.body.appendChild(overlay);
    const $=id=>overlay.querySelector("#"+id);
    const province=$("biloProvince"),territory=$("biloTerritory"),local=$("biloLocal"),localLabel=$("biloLocalLabel"),manual=$("biloManual");
    const option=(value,text)=>'<option value="'+esc(value)+'">'+esc(text)+'</option>';
    const fill=(select,items,placeholder,selected)=>{select.innerHTML=option("",placeholder)+items.map(x=>'<option value="'+esc(getId(x))+'" '+(getId(x)===String(selected||"")?"selected":"")+'>'+esc(getName(x))+'</option>').join("");select.disabled=!items.length;};
    function children(items,parentId){return sortNames(items.filter(x=>getParent(x)===String(parentId)));}
    function updateLocal(){
      const pid=territory.value;
      if(!reference||!pid){fill(local,[],"Choisissez d’abord une ville ou un territoire");return;}
      if(province.options[province.selectedIndex]?.text==="Kinshasa"){
        localLabel.textContent="3. Commune";
        fill(local,kinshasaCommunes.map((name,i)=>({id:"KIN-COM-"+(i+1),name_local:name,parent_id:pid})),"Sélectionner une commune",saved.localId);
      }else{
        localLabel.textContent="3. Secteur, chefferie ou entité locale";
        fill(local,children(reference.sector,pid),"Sélectionner une entité locale",saved.localId);
      }
    }
    function updateTerritories(){
      const selected=province.value;
      const items=reference?children(reference.territory,selected):[];
      fill(territory,items,"Sélectionner une ville ou un territoire",saved.territoryId);
      updateLocal();
    }
    (async()=>{
      reference=await loadReference();
      const provinces=reference?sortNames(reference.province):provinceFallback.map((name,i)=>({id:"fallback-"+i,name_local:name}));
      fill(province,provinces,"Sélectionner une province",saved.provinceId);
      if(!saved.provinceId&&saved.province){
        const legacy=[...province.options].find(o=>o.textContent===saved.province);
        if(legacy){province.value=legacy.value;saved.provinceId=legacy.value;}
      }
      if(!reference){
        $("biloGeoNotice").textContent="Référentiel détaillé momentanément indisponible. Sélectionnez la province et indiquez votre ville, territoire ou commune dans le champ libre.";
        territory.disabled=false;territory.innerHTML=option("manual","Saisir ma ville ou mon territoire");
        local.disabled=true;local.innerHTML=option("","Saisie manuelle");
      }else{
        if(saved.provinceId)updateTerritories();
      }
    })();
    province.addEventListener("change",()=>{
      saved.provinceId=province.value;
      saved.province=getName(province.selectedOptions[0]);
      saved.territoryId="";saved.territory="";saved.localId="";saved.commune="";
      if(reference)updateTerritories();
      else{territory.disabled=false;territory.innerHTML=option("manual","Saisir ma ville ou mon territoire");}
    });
    territory.addEventListener("change",()=>{
      saved.territoryId=territory.value;
      saved.territory=territory.selectedOptions[0]?.textContent||"";
      saved.localId="";saved.commune="";
      updateLocal();
    });
    overlay.addEventListener("click",e=>{
      if(e.target===overlay||e.target.closest("[data-loc-close]")){overlay.remove();return;}
      if(!e.target.closest("[data-loc-save]"))return;
      const p=province.selectedOptions[0]?.textContent||"";
      if(!province.value){alert("Sélectionnez une province.");return;}
      const t=territory.selectedOptions[0]?.textContent||"";
      const l=local.selectedOptions[0]?.textContent||"";
      const free=manual.value.trim();
      if(reference&&!territory.value){alert("Sélectionnez une ville ou un territoire.");return;}
      if(reference&&local.options.length>1&&!local.value&&!free){alert("Sélectionnez une commune ou une entité locale, ou indiquez votre localité.");return;}
      saved.province=p;
      saved.territory=reference?t:free;
      saved.commune=reference?(local.value?l:free):(free||"");
      saved.localId=local.value||"";
      saved.neighborhood=free;
      saved.location=[p,saved.territory,saved.commune].filter(Boolean).join(" · ");
      localStorage.setItem(STORE,JSON.stringify(saved));
      if(typeof S!=="undefined"&&S){S.province=saved.province;S.territory=saved.territory;S.commune=saved.commune;S.location=saved.location;}
      window.dispatchEvent(new CustomEvent("bilocost:locationChanged",{detail:{...saved}}));
      setLabel();overlay.remove();
      if(typeof toast==="function")toast("Localisation enregistrée : "+saved.location);
    });
  }
  document.addEventListener("click",e=>{
    const chip=e.target.closest("header .commune");
    if(chip){e.preventDefault();e.stopPropagation();open();}
  },true);
  const css=document.createElement("style");
  css.textContent="@media(max-width:390px){header .commune{max-width:42px!important;width:42px!important}header .commune #communeLbl{display:none!important}}";
  document.head.appendChild(css);
  setLabel();
  new MutationObserver(setLabel).observe(document.documentElement,{childList:true,subtree:true});
  window.bilocostGetLocation=()=>({...saved});
})();