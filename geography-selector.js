/* Bilocost national location selector: province first, then local administrative area. */
(function(){
  if(window.__biloNationalLocationInstalled) return;
  window.__biloNationalLocationInstalled = true;
  const provinces = [
    "Bas-Uele","Équateur","Haut-Katanga","Haut-Lomami","Haut-Uele","Ituri",
    "Kasaï","Kasaï-Central","Kasaï-Oriental","Kinshasa","Kongo Central",
    "Kwango","Kwilu","Lomami","Lualaba","Mai-Ndombe","Maniema","Mongala",
    "Nord-Kivu","Nord-Ubangi","Sankuru","Sud-Kivu","Sud-Ubangi","Tanganyika",
    "Tshopo","Tshuapa"
  ];
  const key="bilocost_location_v1";
  const read=()=>{try{return JSON.parse(localStorage.getItem(key)||"{}")}catch(_){return {}}};
  const saved=read();
  const escText=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function label(){
    const p=saved.province||"Choisir province", c=saved.commune||"Choisir commune";
    const el=document.getElementById("communeLbl");
    if(el) el.textContent=saved.province&&saved.commune ? c : (saved.province||"RDC");
    const chip=document.querySelector("header .commune");
    if(chip) chip.title=saved.province&&saved.commune ? p+" · "+c : "Choisir votre province et votre commune";
  }
  function open(){
    const overlay=document.createElement("div");
    overlay.id="biloLocationOverlay";
    overlay.style.cssText="position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.48);display:flex;align-items:flex-end;justify-content:center;padding:12px";
    overlay.innerHTML='<section role="dialog" aria-modal="true" aria-label="Choisir votre localisation" style="width:min(100%,520px);max-height:88vh;overflow:auto;background:var(--card,#fff);color:var(--text,#18231d);border-radius:22px;padding:20px;box-shadow:0 15px 50px #0004"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h2 style="margin:0;font-size:20px">Votre localisation</h2><button type="button" data-loc-close aria-label="Fermer" style="border:0;background:transparent;font-size:24px">×</button></div><p class="sub">Bilocost couvre les 26 provinces de la RDC. Choisissez d’abord votre province.</p><label for="biloProvince" style="display:block;margin:14px 0 6px;font-weight:700">Province</label><select id="biloProvince" class="f" style="width:100%;padding:13px;border-radius:12px"><option value="">Sélectionner une province</option>'+provinces.map(p=>'<option value="'+escText(p)+'" '+(saved.province===p?'selected':'')+'>'+escText(p)+'</option>').join("")+'</select><label for="biloCommune" style="display:block;margin:14px 0 6px;font-weight:700">Commune, ville ou territoire</label><input id="biloCommune" class="f" style="width:100%;padding:13px;border-radius:12px" placeholder="Ex. : Ngaliema, Lubumbashi, Mbanza-Ngungu" value="'+escText(saved.commune||"")+'" autocomplete="address-level3"><p class="sub" style="font-size:12px">Pour les provinces rurales, indiquez votre ville ou territoire si votre zone ne possède pas de commune.</p><button type="button" data-loc-save class="btn" style="width:100%;margin-top:16px">Enregistrer ma localisation</button></section>';
    document.body.appendChild(overlay);
    overlay.addEventListener("click",e=>{
      if(e.target===overlay||e.target.closest("[data-loc-close]")){overlay.remove();return;}
      if(e.target.closest("[data-loc-save]")){
        const province=overlay.querySelector("#biloProvince").value;
        const commune=overlay.querySelector("#biloCommune").value.trim();
        if(!province){alert("Sélectionnez une province.");return;}
        if(!commune){alert("Indiquez votre commune, ville ou territoire.");return;}
        saved.province=province;saved.commune=commune;
        localStorage.setItem(key,JSON.stringify(saved));
        if(typeof S!=="undefined"&&S){S.province=province;S.commune=commune;S.location=province+" · "+commune;}
        window.dispatchEvent(new CustomEvent("bilocost:locationChanged",{detail:{province,commune}}));
        label();overlay.remove();
        if(typeof toast==="function") toast("Localisation enregistrée : "+province+" · "+commune);
      }
    });
  }
  document.addEventListener("click",e=>{
    const chip=e.target.closest("header .commune");
    if(chip){e.preventDefault();e.stopPropagation();open();}
  },true);
  const css=document.createElement("style");
  css.textContent="@media(max-width:390px){header .commune{max-width:42px!important;width:42px!important}header .commune #communeLbl{display:none!important}}";
  document.head.appendChild(css);
  label();
  window.bilocostGetLocation=()=>({...saved});
})();