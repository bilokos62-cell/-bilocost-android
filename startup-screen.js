/* Bilocost startup screen polish. Scoped strictly to the initial cloud-loading state. */
(function(){
  "use strict";
  const applyHeaderLogo=()=>{
    try{
      if(typeof LOGO==="string"&&LOGO.startsWith("data:image/")){
        document.querySelectorAll("header img.lg").forEach(img=>{
          if(img.getAttribute("src")!==LOGO)img.src=LOGO;
          img.style.display="block";
          img.style.objectFit="contain";
          img.style.background="transparent";
        });
      }
    }catch(_){}
  };
  const decorateLoader=()=>{
    applyHeaderLogo();
    const view=document.getElementById("view");
    if(!view)return;
    const panel=view.querySelector('section[role="status"]');
    if(!panel||!/^Chargement de Bilocost$/i.test((panel.querySelector("b")?.textContent||"").trim()))return;
    panel.classList.add("bilo-startup-loading");
    if(panel.querySelector(".bilo-startup-brand"))return;
    const brand=document.createElement("div");
    brand.className="bilo-startup-brand";
    const logo=document.createElement("img");
    logo.alt="Bilocost";
    logo.src=typeof LOGO==="string"?LOGO:"";
    logo.className="bilo-startup-logo";
    const orbit=document.createElement("span");
    orbit.className="bilo-startup-orbit";
    const word=document.createElement("strong");
    word.textContent="Bilocost";
    const slogan=document.createElement("small");
    slogan.textContent="Notre marché. Notre plateforme. Notre avenir.";
    const mark=document.createElement("div");
    mark.className="bilo-startup-mark";
    mark.append(logo,orbit);
    brand.append(mark,word,slogan);
    const title=panel.querySelector("b");
    if(title)title.replaceWith(brand);
    const spinner=panel.querySelector('div[aria-hidden="true"]');
    if(spinner)spinner.remove();
  };
  const start=()=>{
    applyHeaderLogo();
    decorateLoader();
    const view=document.getElementById("view");
    if(view&&window.MutationObserver){
      const observer=new MutationObserver(()=>decorateLoader());
      observer.observe(view,{childList:true,subtree:true});
    }
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
  window.addEventListener("load",applyHeaderLogo,{once:true});
})();

/* CSS is injected separately by the deploy workflow. */
