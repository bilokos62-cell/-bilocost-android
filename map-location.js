/* Bilocost — OpenStreetMap + Leaflet location picker.
 * GPS is requested only after an explicit user action. No background tracking.
 */
(function(){
  if(window.__biloOsmLeafletInstalled)return;
  window.__biloOsmLeafletInstalled=true;
  const STORE="bilocost_location_v2";
  const read=()=>{try{return JSON.parse(localStorage.getItem(STORE)||"{}")}catch(_){return {}}};
  let leafletPromise=null,map=null,marker=null,selected=null;
  const loadLeaflet=()=>{
    if(window.L)return Promise.resolve(window.L);
    if(leafletPromise)return leafletPromise;
    leafletPromise=new Promise((resolve,reject)=>{
      if(!document.getElementById("bilo-leaflet-css")){
        const css=document.createElement("link");css.id="bilo-leaflet-css";css.rel="stylesheet";
        css.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(css);
      }
      const script=document.createElement("script");script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload=()=>window.L?resolve(window.L):reject(new Error("Leaflet indisponible"));
      script.onerror=()=>reject(new Error("Impossible de charger Leaflet"));
      document.head.appendChild(script);
    });
    return leafletPromise;
  };
  const center=()=>{
    const s=read();
    return Number.isFinite(Number(s.latitude))&&Number.isFinite(Number(s.longitude))
      ?[Number(s.latitude),Number(s.longitude)]:[-4.325,15.322];
  };
  async function reverse(lat,lon){
    try{
      const url="https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat="+encodeURIComponent(lat)+"&lon="+encodeURIComponent(lon)+"&zoom=18&addressdetails=1";
      const response=await fetch(url,{headers:{Accept:"application/json"}});
      if(!response.ok)throw new Error("Adresse indisponible");
      const data=await response.json(),a=data.address||{};
      return {label:data.name||data.display_name||"",neighborhood:a.suburb||a.neighbourhood||a.quarter||a.village||a.town||a.city_district||""};
    }catch(_){return {label:"",neighborhood:""};}
  }
  function ensureStyle(){
    if(document.getElementById("biloOsmStyle"))return;
    const style=document.createElement("style");style.id="biloOsmStyle";
    style.textContent=[
      "#biloOsmOpen{width:100%;margin:10px 0 0;padding:12px;border:1px solid #16804a;border-radius:12px;background:#edf8f1;color:#145b35;font:700 14px system-ui;cursor:pointer}",
      "#biloOsmModal{position:fixed;inset:0;z-index:10070;background:rgba(5,18,12,.66);display:flex;align-items:center;justify-content:center;padding:12px}",
      "#biloOsmModal .bilo-osm-card{width:min(100%,680px);max-height:94vh;overflow:auto;background:#fff;color:#17251e;border-radius:20px;padding:15px;box-shadow:0 18px 60px #0005}",
      "#biloOsmModal .bilo-osm-head{display:flex;align-items:center;gap:10px;justify-content:space-between}",
      "#biloOsmModal h3{font-size:18px;margin:0}#biloOsmModal p{font-size:12px;color:#596b61;margin:6px 0 12px}",
      "#biloOsmMap{height:min(54vh,430px);min-height:260px;border-radius:14px;overflow:hidden;background:#e9efeb}",
      "#biloOsmModal .bilo-osm-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}",
      "#biloOsmModal button{border:0;border-radius:11px;padding:11px 13px;font:700 13px system-ui;cursor:pointer}",
      "#biloOsmGps{background:#eaf5ee;color:#145b35}#biloOsmSave{background:#087542;color:white;flex:1}#biloOsmClose{background:#f0f2f1;color:#27352d}",
      "#biloOsmStatus{min-height:18px;margin:8px 0 0!important}",
      "@media(max-width:420px){#biloOsmModal{padding:7px}#biloOsmModal .bilo-osm-card{padding:12px}#biloOsmMap{height:48vh;min-height:240px}}"
    ].join("\n");
    document.head.appendChild(style);
  }
  function showModal(){
    if(document.getElementById("biloOsmModal"))return;
    ensureStyle();selected=read();
    const modal=document.createElement("div");modal.id="biloOsmModal";
    modal.innerHTML='<section class="bilo-osm-card" role="dialog" aria-modal="true" aria-label="Position sur la carte"><div class="bilo-osm-head"><h3>Préciser ma position</h3><button id="biloOsmClose" type="button">Fermer</button></div><p>Déplacez la carte et touchez le point exact. Le GPS sera utilisé uniquement si vous appuyez sur « Ma position GPS ».</p><div id="biloOsmMap" aria-label="Carte OpenStreetMap"></div><p id="biloOsmStatus" aria-live="polite">Touchez la carte pour placer le repère.</p><div class="bilo-osm-actions"><button id="biloOsmGps" type="button">◎ Ma position GPS</button><button id="biloOsmSave" type="button" disabled>Confirmer cette position</button></div><p style="margin-bottom:0">© OpenStreetMap contributors · Adresse via Nominatim</p></section>';
    document.body.appendChild(modal);
    const status=modal.querySelector("#biloOsmStatus"),save=modal.querySelector("#biloOsmSave");
    const setPoint=async(lat,lon,zoom)=>{
      selected={...selected,latitude:Number(lat),longitude:Number(lon)};
      if(marker)marker.setLatLng([lat,lon]);
      else marker=window.L.marker([lat,lon],{draggable:true}).addTo(map);
      marker.off("dragend").on("dragend",e=>{const p=e.target.getLatLng();setPoint(p.lat,p.lng,map.getZoom());});
      save.disabled=false;status.textContent="Position sélectionnée : "+Number(lat).toFixed(5)+", "+Number(lon).toFixed(5)+" · Recherche de l’adresse…";
      status.textContent="Coordonnées : "+Number(lat).toFixed(5)+", "+Number(lon).toFixed(5);
      if(zoom)map.setView([lat,lon],zoom);
    };
    const close=()=>{modal.remove();map=null;marker=null;};
    modal.querySelector("#biloOsmClose").onclick=close;
    modal.addEventListener("click",e=>{if(e.target===modal)close();});
    loadLeaflet().then(L=>{
      map=L.map("biloOsmMap",{zoomControl:true}).setView(center(),selected.latitude?15:12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);
      if(Number.isFinite(Number(selected.latitude))&&Number.isFinite(Number(selected.longitude)))setPoint(Number(selected.latitude),Number(selected.longitude));
      map.on("click",e=>setPoint(e.latlng.lat,e.latlng.lng));
      setTimeout(()=>map.invalidateSize(),120);
    }).catch(error=>{status.textContent=error.message+" ; vérifiez votre connexion internet.";});
    modal.querySelector("#biloOsmGps").onclick=()=>{
      if(!navigator.geolocation){status.textContent="La géolocalisation n’est pas disponible sur cet appareil.";return;}
      status.textContent="Recherche de votre position…";
      navigator.geolocation.getCurrentPosition(pos=>{if(!map)return;setPoint(pos.coords.latitude,pos.coords.longitude,17);},error=>{
        status.textContent=error.code===1?"Autorisez la localisation dans les paramètres du navigateur puis réessayez.":"Position GPS indisponible. Vérifiez le GPS et réessayez.";
      },{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
    };
    save.onclick=()=>{
      if(!selected||!Number.isFinite(Number(selected.latitude))||!Number.isFinite(Number(selected.longitude)))return;
      const current=read(),updated={...current,latitude:Number(selected.latitude),longitude:Number(selected.longitude),coordinatesSource:"user-selected",coordinatesUpdatedAt:Date.now()};
      save.disabled=true;status.textContent="Enregistrement de la position…";
      const place=await reverse(updated.latitude,updated.longitude);
      if(place.label)updated.mapAddress=place.label;
      if(place.neighborhood)updated.neighborhood=place.neighborhood;
      localStorage.setItem(STORE,JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("bilocost:coordinatesChanged",{detail:{latitude:updated.latitude,longitude:updated.longitude,mapAddress:updated.mapAddress||""}}));
      close();
      if(typeof window.toast==="function")window.toast("Position enregistrée.");
    };
  }
  function injectButton(){
    const overlay=document.getElementById("biloLocationOverlay");
    if(!overlay)return;
    const section=overlay.querySelector("section"),save=overlay.querySelector("[data-loc-save]");
    if(!section||!save||section.querySelector("#biloOsmOpen"))return;
    const button=document.createElement("button");button.type="button";button.id="biloOsmOpen";
    button.textContent="⌖ Ajouter ma position sur la carte";button.addEventListener("click",showModal);
    save.parentNode.insertBefore(button,save);
    const p=document.createElement("p");p.id="biloOsmLocationStatus";p.style.cssText="font-size:11px;color:#52645a;margin:6px 0 0";
    const current=read();p.textContent=Number.isFinite(Number(current.latitude))&&Number.isFinite(Number(current.longitude))?"Position précise déjà enregistrée.":"Optionnel : ajoutez un point précis pour faciliter les livraisons.";
    save.parentNode.insertBefore(p,save);
  }
  new MutationObserver(injectButton).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("DOMContentLoaded",injectButton);injectButton();
  const originalPublish=typeof publishCloud==="function"?publishCloud:null;
  if(originalPublish){
    publishCloud=async function(form){
      const loc=read();
      if(Number.isFinite(Number(loc.latitude))&&Number.isFinite(Number(loc.longitude))){
        form.latitude=Number(loc.latitude);form.longitude=Number(loc.longitude);
        form.coordinatesSource="user-selected";
        if(loc.mapAddress)form.mapAddress=String(loc.mapAddress).slice(0,300);
      }
      return originalPublish.apply(this,arguments);
    };
  }
  window.bilocostGetCoordinates=()=>{const s=read();return Number.isFinite(Number(s.latitude))&&Number.isFinite(Number(s.longitude))?{latitude:Number(s.latitude),longitude:Number(s.longitude)}:null;};
})();