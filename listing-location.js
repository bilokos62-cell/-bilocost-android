/* Bilocost — connect the national location selector to listings and catalogue filters. */
(function(){
  if(window.__biloListingLocationInstalled) return;
  window.__biloListingLocationInstalled = true;
  const getLocation=()=>{try{return typeof window.bilocostGetLocation==="function"?window.bilocostGetLocation():JSON.parse(localStorage.getItem("bilocost_location_v2")||"{}")}catch(_){return {}}};
  const locationValue=loc=>String(loc.commune||loc.territory||loc.neighborhood||"").trim();
  function syncPublicationLocation(){
    const loc=getLocation(),value=locationValue(loc),select=document.getElementById("pcm");
    if(select&&value){
      select.innerHTML='<option value="'+esc(value)+'">'+esc(value)+'</option>';
      select.value=value;
      const label=select.previousElementSibling;
      if(label&&label.tagName==="LABEL")label.textContent="Localité de l’annonce *";
      select.title=[loc.province,loc.territory,loc.commune,loc.neighborhood].filter(Boolean).join(" · ");
    }
  }
  const originalList=list;
  const normalizeLocation=value=>String(value||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").trim().toLocaleLowerCase("fr");
  list=function(){
    const loc=getLocation();
    if(!loc.province)return originalList();
    const previous=S.commune;
    try{
      // Load the catalogue without the legacy single-commune restriction first.
      // The location preference must never make every public listing disappear.
      S.commune="Kinshasa";
      const all=originalList();
      const province=normalizeLocation(loc.province);
      const territory=normalizeLocation(loc.territory);
      const commune=normalizeLocation(loc.commune||loc.territory||loc.neighborhood);
      const local=all.filter(item=>{
        const itemProvince=normalizeLocation(item.province);
        const itemTerritory=normalizeLocation(item.territory);
        const itemCommune=normalizeLocation(item.locality||item.commune||item.c);
        if(itemProvince&&itemProvince!==province)return false;
        if(territory&&itemTerritory&&itemTerritory!==territory)return false;
        if(commune&&itemCommune&&itemCommune!==commune)return false;
        // Legacy records without full geographic metadata remain visible.
        return true;
      });
      // If the selected locality has no exact matches, show the available
      // catalogue instead of an empty home/search screen.
      return local.length?local:all;
    }finally{S.commune=previous;}
  };
  const originalPublishCloud=publishCloud;
  publishCloud=async function(form){
    const loc=getLocation(),value=locationValue(loc);
    if(!loc.province||!value)throw new Error("Choisissez votre province et votre localité avant de publier.");
    form.c=value;
    form.province=loc.province||"";
    form.territory=loc.territory||"";
    form.locality=loc.commune||loc.territory||loc.neighborhood||"";
    form.locationLabel=loc.location||[loc.province,loc.territory,loc.commune].filter(Boolean).join(" · ");
    form.neighborhood=loc.neighborhood||"";
    return originalPublishCloud(form);
  };
  const originalRender=render;
  render=function(){
    originalRender();
    syncPublicationLocation();
  };
  window.addEventListener("bilocost:locationChanged",()=>{
    const loc=getLocation();
    S.commune=locationValue(loc)||"Kinshasa";
    syncPublicationLocation();
    if(typeof render==="function")render();
  });
  syncPublicationLocation();
})();
