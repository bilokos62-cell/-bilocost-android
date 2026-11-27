/* Bilocost — OpenStreetMap + Leaflet location picker. */
(function(){
  "use strict";
  if(window.__biloLeafletLocationInstalled)return;
  window.__biloLeafletLocationInstalled=true;
  const cssId="bilo-leaflet-css",scriptId="bilo-leaflet-js";
  const css=document.createElement("link");css.id=cssId;css.rel="stylesheet";css.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";css.crossOrigin="";
  document.head.appendChild(css);
  function loadLeaflet(){
    if(window.L)return Promise.resolve();
    if(window.__biloLeafletPromise)return window.__biloLeafletPromise;
    window.__biloLeafletPromise=new Promise((resolve,reject)=>{
      const s=document.createElement("script");s.id=scriptId;s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.crossOrigin="";
      s.onload=()=>resolve();s.onerror=()=>reject(new Error("Carte indisponible"));
      document.head.appendChild(s);
    });
    return window.__biloLeafletPromise;
  }
  const getLoc=()=>typeof window.bilocostGetLocation==="function"?window.bilocostGetLocation():{};
  const kin=[-4.325,15.322];
  let map=null,marker=null,activeOverlay=null,chosenAddress="";
  const style=document.createElement("style");
  style.textContent="#bilo-osm-panel{margin:12px 0 14px;padding:12px;border:1px solid #dce7df;border-radius:15px;background:#f8fbf9;color:#17251e}#bilo-osm-map{height:220px;width:100%;border-radius:11px;overflow:hidden;background:#e7eee9;z-index:1}#bilo-osm-panel .bilo-osm-actions{display:flex;gap:8px;flex-wrap:wrap;margin:9px 0 5px}#bilo-osm-panel button{border:1px solid #cbd9d0;border-radius:10px;padding:9px 11px;background:#fff;color:#174d30;font-weight:700;font-size:12px}#bilo-osm-status{font-size:11px;color:#53675b;margin:5px 0 0;line-height:1.4}#bilo-osm-coords{font-size:10px;color:#607368;margin-top:4px}";
  document.head.appendChild(style);
  function reverse(lat,lng){
    return fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat="+encodeURIComponent(lat)+"&lon="+encodeURIComponent(lng)+"&accept-language=fr",{headers:{Accept:"application/json"}})
      .then(r=>{if(!r.ok)throw new Error("Adresse non trouvée");return r.json();})
      .then(d=>d.display_name||"").catch(()=> "");
  }
  async function setPoint(lat,lng,fromGps){
    if(!marker||!map)return;
    marker.setLatLng([lat,lng]);map.setView([lat,lng],Math.max(map.getZoom(),15));
    const status=activeOverlay?.querySelector("#bilo-osm-status"),coords=activeOverlay?.querySelector("#bilo-osm-coords");
    if(status)status.textContent="Recherche de l’adresse…";
    if(coords)coords.textContent=lat.toFixed(6)+", "+lng.toFixed(6);
    chosenAddress=await reverse(lat,lng);
    if(typeof window.bilocostSetCoordinates==="function")window.bilocostSetCoordinates(lat,lng,chosenAddress);
    if(status)status.textContent=chosenAddress?("Position choisie : "+chosenAddress):"Position GPS enregistrée. L’adresse détaillée n’a pas pu être récupérée.";
  }
  async function init(overlay){
    if(overlay.dataset.biloMapReady==="1")return;
    overlay.dataset.biloMapReady="1";
    const header=overlay.querySelector("section>div");
    if(!header)return;
    const panel=document.createElement("div");panel.id="bilo-osm-panel";
    panel.innerHTML='<div style="font-weight:800;font-size:13px;margin-bottom:7px">Position précise sur la carte</div><div id="bilo-osm-map" role="application" aria-label="Carte OpenStreetMap, déplacer le marqueur pour choisir sa position"></div><div class="bilo-osm-actions"><button type="button" data-osm-gps>Utiliser le GPS</button><button type="button" data-osm-center>Recentrer sur Kinshasa</button></div><p id="bilo-osm-status">Déplacez le marqueur ou utilisez le GPS pour préciser votre adresse.</p><div id="bilo-osm-coords"></div><div style="font-size:9px;color:#66786d;margin-top:5px">© OpenStreetMap · Carte fournie par Leaflet</div>';
    header.insertAdjacentElement("afterend",panel);
    try{
      await loadLeaflet();
      if(!overlay.isConnected)return;
      const loc=getLoc(),lat=Number(loc.latitude),lng=Number(loc.longitude);
      const center=Number.isFinite(lat)&&Number.isFinite(lng)?[lat,lng]:kin;
      map=L.map("bilo-osm-map",{scrollWheelZoom:false}).setView(center,Number.isFinite(lat)&&Number.isFinite(lng)?15:11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);
      marker=L.marker(center,{draggable:true}).addTo(map);
      marker.on("dragend",()=>{const p=marker.getLatLng();setPoint(p.lat,p.lng,false);});
      map.on("click",e=>setPoint(e.latlng.lat,e.latlng.lng,false));
      setTimeout(()=>map.invalidateSize(),150);
      if(Number.isFinite(lat)&&Number.isFinite(lng)){
        const coords=panel.querySelector("#bilo-osm-coords");if(coords)coords.textContent=lat.toFixed(6)+", "+lng.toFixed(6);
        const status=panel.querySelector("#bilo-osm-status");if(status)status.textContent=loc.mapAddress||"Dernière position enregistrée.";
      }
    }catch(_){
      panel.querySelector("#bilo-osm-map").innerHTML='<div style="padding:18px;font-size:12px;color:#53675b">La carte ne peut pas être chargée. Vérifiez votre connexion, puis réessayez.</div>';
    }
    panel.addEventListener("click",async e=>{
      if(e.target.closest("[data-osm-center]")){map?.setView(kin,11);return;}
      if(!e.target.closest("[data-osm-gps]"))return;
      const status=panel.querySelector("#bilo-osm-status");
      if(!navigator.geolocation){status.textContent="La géolocalisation n’est pas prise en charge sur cet appareil.";return;}
      status.textContent="Obtention de votre position GPS…";
      navigator.geolocation.getCurrentPosition(pos=>setPoint(pos.coords.latitude,pos.coords.longitude,true),err=>{
        status.textContent=err.code===1?"Autorisez la localisation dans les réglages du téléphone et du navigateur.":err.code===2?"Position GPS indisponible. Déplacez le marqueur manuellement.":"Délai GPS dépassé. Réessayez ou déplacez le marqueur.";
      },{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
    });
    const close=()=>{if(map){map.remove();map=null;marker=null;}activeOverlay=null;};
    overlay.querySelectorAll("[data-loc-close]").forEach(b=>b.addEventListener("click",close,{once:true}));
    overlay.addEventListener("click",e=>{if(e.target===overlay)close();},{once:true});
  }
  const observer=new MutationObserver(()=>{
    const overlay=document.getElementById("biloLocationOverlay");
    if(overlay&&overlay!==activeOverlay){if(map){map.remove();map=null;marker=null;}activeOverlay=overlay;init(overlay);}
    if(!overlay&&map){map.remove();map=null;marker=null;activeOverlay=null;}
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();