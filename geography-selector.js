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
  const saved=read(STORE,read("bilocost_location_v1",{}));
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
    const visible=saved.province?(saved.province==="Kinshasa"&&saved.commune?saved.commune:local):"RDC";
    if(label&&label.textContent!==visible)label.textContent=visible;
    const chip=document.querySelector("header .commune");
    if(chip)chip.title=saved.province?[province,saved.territory,saved.commune].filter(Boolean).join(" · "):"Choisir votre province et votre localité";
  }
  function open(){
    if(document.getElementById("biloLocationOverlay"))return;
    const overlay=document.createElement("div");
    overlay.id="biloLocationOverlay";
    overlay.style.cssText="position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center;padding:12px";
    overlay.innerHTML='<section role="dialog" aria-modal="true" aria-label="Choisir votre localisation" style="width:min(100%,520px);max-height:90vh;overflow:auto;background:var(--card,#fff);color:var(--text,#18231d);border-radius:22px;padding:18px;box-shadow:0 15px 50px #0004"><div style="display:flex;align-items:center;gap:10px"><button type="button" id="biloLocBack" aria-label="Retour" style="display:none;border:0;background:var(--panel,#f2f4f3);border-radius:12px;width:40px;height:40px;font-size:20px">‹</button><div style="flex:1"><h2 id="biloLocTitle" style="margin:0;font-size:20px">Choisir une province</h2><p id="biloLocPath" class="sub" style="margin:4px 0 0;font-size:12px">République démocratique du Congo</p></div><button type="button" data-loc-close aria-label="Fermer" style="border:0;background:transparent;font-size:24px">×</button></div><input id="biloLocSearch" class="f" type="search" placeholder="Rechercher…" style="width:100%;padding:12px;margin:14px 0 8px;border-radius:12px"><div id="biloLocList" style="display:grid;gap:7px;max-height:52vh;overflow:auto"></div><div id="biloLocManualWrap" style="display:none;margin-top:12px"><label for="biloLocManual" style="display:block;font-weight:700;margin-bottom:6px">Quartier ou localité</label><input id="biloLocManual" class="f" style="width:100%;padding:12px" placeholder="Ex. : Kinsuka, quartier…"></div><p class="sub" id="biloGeoNotice" style="font-size:11px;margin:12px 0 0">Sélectionnez une province, puis votre localité.</p><button type="button" data-loc-save class="btn" style="width:100%;margin-top:14px" disabled>Enregistrer ma localisation</button></section>';
    document.body.appendChild(overlay);
    const $=id=>overlay.querySelector("#"+id),list=$("biloLocList"),search=$("biloLocSearch"),back=$("biloLocBack"),manualWrap=$("biloLocManualWrap"),manual=$("biloLocManual"),saveBtn=overlay.querySelector("[data-loc-save]");
    const state={step:"province",province:null,territory:null,local:null,manual:saved.neighborhood||""};
    let provinces=[],territories=[],locals=[];
    const children=(items,parentId)=>sortNames(items.filter(x=>getParent(x)===String(parentId)));
    const btn=(id,name,selected)=>'<button type="button" data-pick="'+esc(id)+'" style="display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:14px 13px;border:1px solid var(--line,#e5e7eb);border-radius:13px;background:'+(selected?'var(--mint,#e8f7ee)':'var(--panel,#fff)')+';color:inherit;text-align:left;font:600 14px Inter,system-ui;cursor:pointer"><span>'+esc(name)+'</span><span style="opacity:.55;font-size:18px">›</span></button>';
    function selectedName(x){return x?getName(x):"";}
    function refresh(){
      const q=search.value.trim().toLocaleLowerCase("fr");
      const data=state.step==="province"?provinces:state.step==="territory"?territories:locals;
      $("biloLocTitle").textContent=state.step==="province"?"Choisir une province":state.step==="territory"?"Choisir une ville ou un territoire":"Choisir une commune ou un quartier";
      $("biloLocPath").textContent=[selectedName(state.province),selectedName(state.territory)].filter(Boolean).join(" · ")||"République démocratique du Congo";
      back.style.display=state.step==="province"?"none":"block";
      search.placeholder=state.step==="province"?"Rechercher une province…":"Rechercher une localité…";
      list.innerHTML=data.filter(x=>getName(x).toLocaleLowerCase("fr").includes(q)).map(x=>btn(getId(x),getName(x),state.local&&getId(state.local)===getId(x))).join("")||'<p class="sub" style="padding:12px">Aucun résultat dans cette liste.</p>';
      manualWrap.style.display=state.step==="local"?"block":"none";
      manual.value=state.manual;
      saveBtn.disabled=!(state.province&&(state.step==="local"&&(state.local||state.manual.trim())||!reference&&state.manual.trim()));
      $("biloGeoNotice").textContent=reference?"Touchez une province, puis votre ville et votre commune/quartier.":"Référentiel momentanément indisponible : sélectionnez une province et saisissez votre ville ou quartier.";
    }
    function showTerritories(){
      state.step="territory";
      territories=reference?children(reference.territory,getId(state.province)):[];
      if(state.province&&getName(state.province)==="Kinshasa"&&reference){
        state.territory={id:"KIN-CITY",name_local:"Kinshasa"};
        showLocals();
        return;
      }
      refresh();
    }
    function showLocals(){
      state.step="local";
      if(reference&&state.territory){
        if(getName(state.province)==="Kinshasa"){
          locals=kinshasaCommunes.map((name,i)=>({id:"KIN-COM-"+(i+1),name_local:name,parent_id:"KIN-CITY"}));
        }else locals=children(reference.sector,getId(state.territory));
      }else locals=[];
      refresh();
    }
    (async()=>{
      reference=await loadReference();
      provinces=reference?sortNames(reference.province):provinceFallback.map((name,i)=>({id:"fallback-"+i,name_local:name}));
      if(saved.province){
        state.province=provinces.find(x=>getName(x)===saved.province)||null;
        if(state.province&&reference){
          if(getName(state.province)==="Kinshasa"){showTerritories();state.local=locals.find(x=>getName(x)===saved.commune)||null;}
          else{
            territories=children(reference.territory,getId(state.province));
            state.territory=territories.find(x=>getName(x)===saved.territory)||null;
            if(state.territory){showLocals();state.local=locals.find(x=>getName(x)===saved.commune)||null;}
          }
        }
      }
      if(!reference)$("biloGeoNotice").textContent="Référentiel détaillé indisponible. Vous pouvez saisir votre ville ou quartier manuellement.";
      refresh();
    })();
    list.addEventListener("click",e=>{
      const item=e.target.closest("[data-pick]");
      if(!item)return;
      const id=item.dataset.pick;
      if(state.step==="province"){
        state.province=provinces.find(x=>getId(x)===id)||null;state.territory=null;state.local=null;
        if(reference)showTerritories();else{state.step="local";refresh();}
      }else if(state.step==="territory"){
        state.territory=territories.find(x=>getId(x)===id)||null;state.local=null;showLocals();
      }else{
        state.local=locals.find(x=>getId(x)===id)||null;refresh();
      }
    });
    search.addEventListener("input",refresh);
    manual.addEventListener("input",()=>{state.manual=manual.value;refresh()});
    back.addEventListener("click",()=>{
      if(state.step==="local"&&getName(state.province)!=="Kinshasa"){state.step="territory";state.local=null;}
      else{state.step="province";state.province=null;state.territory=null;state.local=null;}
      search.value="";refresh();
    });
    overlay.addEventListener("click",e=>{
      if(e.target===overlay||e.target.closest("[data-loc-close]")){overlay.remove();return;}
      if(!e.target.closest("[data-loc-save]"))return;
      if(!state.province){alert("Sélectionnez une province.");return;}
      if(reference&&state.step!=="local"){alert("Choisissez aussi votre commune ou quartier.");return;}
      if(reference&&!state.local&&!state.manual.trim()){alert("Sélectionnez une commune ou saisissez votre quartier.");return;}
      if(!reference&&!state.manual.trim()){alert("Saisissez votre ville ou quartier.");return;}
      saved.province=getName(state.province);
      saved.provinceId=getId(state.province);
      saved.territory=state.territory?getName(state.territory):state.manual.trim();
      saved.territoryId=state.territory?getId(state.territory):"";
      saved.commune=state.local?getName(state.local):state.manual.trim();
      saved.localId=state.local?getId(state.local):"";
      saved.neighborhood=state.manual.trim();
      saved.location=[saved.province,saved.territory!==saved.province?saved.territory:"",saved.commune,saved.neighborhood&&saved.neighborhood!==saved.commune?saved.neighborhood:""].filter(Boolean).join(" · ");
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