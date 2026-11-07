/* iOS-only HIG refinements for Bilocost's Capacitor WebView.
   This file is injected only into the iOS build; web and Android remain unchanged. */
(function(){
  if(window.__bilocostIOSHIGInstalled)return;
  window.__bilocostIOSHIGInstalled=true;

  const style=document.createElement("style");
  style.id="bilocost-ios-hig";
  style.textContent=`
    html{min-height:100%;scroll-padding-top:env(safe-area-inset-top,0px);scroll-padding-bottom:env(safe-area-inset-bottom,0px)}
    body{min-height:100dvh;-webkit-overflow-scrolling:touch;overscroll-behavior-y:auto}
    /* Apple's recommended comfortable target is 44 x 44 pt. */
    button,[role="button"],input,select,textarea{min-height:44px}
    button.ib,header .ib,nav button,[role="button"].ib{min-width:44px;min-height:44px}
    input,select,textarea{font-size:16px!important;line-height:1.35}
    button,a,[role="button"]{-webkit-tap-highlight-color:transparent}
    :focus-visible{outline:3px solid var(--pri,#16834b);outline-offset:3px}
    #view,#sheetBody{scroll-margin-top:env(safe-area-inset-top,0px);scroll-margin-bottom:env(safe-area-inset-bottom,0px)}
    @media(prefers-reduced-motion:reduce){
      *,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
    }
    @media(prefers-contrast:more){
      button,a,[role="button"],input,select,textarea{outline-offset:3px}
      #view .card,#view .seller,#sheetBody{border:1px solid currentColor}
      :focus-visible{outline-width:4px}
    }
    @media(max-width:380px){
      button.ib,header .ib,nav button,[role="button"].ib{min-width:44px}
    }
  `;
  (document.head||document.documentElement).appendChild(style);

  const navLabels={home:"Accueil",search:"Rechercher",msg:"Messages",cart:"Panier",fav:"Favoris",profile:"Profil",account:"Compte",orders:"Commandes",wallet:"Portefeuille"};
  const actionLabels={close:"Fermer",back:"Retour",send:"Envoyer",search:"Rechercher",favorite:"Ajouter aux favoris",share:"Partager",delete:"Supprimer",edit:"Modifier"};
  function accessibleName(el){
    const explicit=el.getAttribute("aria-label")||el.getAttribute("title");
    if(explicit&&explicit.trim())return explicit.trim();
    const text=(el.innerText||el.textContent||"").replace(/\s+/g," ").trim();
    if(text)return "";
    const dataT=el.getAttribute("data-t");
    if(dataT&&navLabels[dataT])return navLabels[dataT];
    const action=el.getAttribute("data-act");
    if(action&&actionLabels[action])return actionLabels[action];
    const image=el.querySelector("img[alt]");
    if(image&&image.alt.trim())return image.alt.trim();
    return "";
  }
  function improveAccessibility(){
    const main=document.getElementById("view");
    if(main&&!main.hasAttribute("role"))main.setAttribute("role","main");
    const nav=document.querySelector("nav");
    if(nav&&!nav.hasAttribute("aria-label"))nav.setAttribute("aria-label","Navigation principale");
    document.querySelectorAll("button,[role='button']").forEach(el=>{
      if(el.hasAttribute("aria-label"))return;
      const name=accessibleName(el);
      if(name)el.setAttribute("aria-label",name);
    });
    document.querySelectorAll("input,select,textarea").forEach(el=>{
      if(el.hasAttribute("aria-label")||el.labels&&el.labels.length)return;
      const placeholder=el.getAttribute("placeholder");
      if(placeholder&&placeholder.trim())el.setAttribute("aria-label",placeholder.trim());
      else if(el.getAttribute("name"))el.setAttribute("aria-label",el.getAttribute("name").replace(/[-_]/g," "));
    });
  }
  improveAccessibility();
  if(window.MutationObserver){
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;improveAccessibility();});
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  /* Diagnostic helper for remote Safari/Web Inspector; no user-facing overlay. */
  window.__bilocostIOSHIGAudit=function(){
    const targets=[...document.querySelectorAll("button,[role='button'],input,select,textarea")];
    const small=targets.filter(el=>{
      const r=el.getBoundingClientRect();
      return r.width>0&&r.height>0&&(r.width<44||r.height<44);
    });
    const unlabeled=[...document.querySelectorAll("button,[role='button']")].filter(el=>
      !((el.getAttribute("aria-label")||el.getAttribute("title")||el.innerText||el.textContent||"").trim())
    );
    return {interactiveTargets:targets.length,undersizedTargets:small.length,unlabeledControls:unlabeled.length,undersizedExamples:small.slice(0,12).map(el=>({tag:el.tagName,text:(el.innerText||el.textContent||"").trim().slice(0,40),width:Math.round(el.getBoundingClientRect().width),height:Math.round(el.getBoundingClientRect().height)}))};
  };
})();
