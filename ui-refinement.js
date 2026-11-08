/* Bilocost UI refinement — shared by web and Android builds. */
(function(){
  if(window.__bilocostUiRefinementInstalled)return;
  window.__bilocostUiRefinementInstalled=true;

  /* The intro is a one-time onboarding step, not a screen to replay on every launch. */
  const markIntroSeen=()=>{
    try{
      localStorage.setItem("bilocost_onboarding_seen_v1","1");
      const saved=JSON.parse(localStorage.getItem("bilo")||"{}");
      saved.seen=true;
      localStorage.setItem("bilo",JSON.stringify(saved));
    }catch(_){}
  };
  document.addEventListener("click",event=>{
    const button=event.target.closest("#auth [data-auth]");
    if(!button)return;
    const action=button.getAttribute("data-auth");
    const auth=document.getElementById("auth");
    const intro=auth&&/Achetez facilement/i.test(auth.textContent||"");
    if(intro&&(action==="signup"||action==="skip"||action==="close"))markIntroSeen();
  },true);

  /* Skip the promotional welcome screen and open identification directly. */
  const bypassWelcomeIntro=()=>{
    const auth=document.getElementById("auth");
    if(!auth||!auth.innerHTML.trim()||!/Achetez facilement/i.test(auth.textContent||""))return;
    const skip=auth.querySelector('[data-auth="skip"]');
    if(skip){
      markIntroSeen();
      skip.click();
    }
  };
  bypassWelcomeIntro();
  if(window.MutationObserver){
    const introObserver=new MutationObserver(bypassWelcomeIntro);
    introObserver.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  }

  const style=document.createElement("style");
  style.id="bilocost-ui-refinement";
  style.textContent=`
    :root{--bilo-radius:18px;--bilo-shadow:0 8px 24px rgba(15,23,42,.055)}
    body{background:var(--bg);-webkit-font-smoothing:antialiased}
    .app{width:100%;max-width:560px}
    header{min-height:62px;box-shadow:0 2px 12px rgba(15,23,42,.035)}
    #view.wrap{padding:16px 16px calc(24px + env(safe-area-inset-bottom,0px))}
    #view h2{letter-spacing:-.035em;line-height:1.25}
    #view h3{letter-spacing:-.02em}
    #view .card,#view .seller,#view .lr,#view .safe,#view .warn{border-radius:16px}
    #view .card{border:1px solid var(--line);box-shadow:var(--bilo-shadow)}
    #view .seller{padding:12px;border:1px solid var(--line);background:var(--card);gap:10px}
    #view .row{gap:10px;align-items:center}
    #view .sub{line-height:1.55}
    #view .btn{min-height:48px;height:auto;min-width:0;padding:13px 18px;border-radius:14px;line-height:1.25;transition:transform .16s ease,filter .16s ease}
    #view .btn:active{transform:scale(.985);filter:brightness(.96)}
    #view .btn.ghost,#view .chip{border:1px solid var(--line)}
    #view input.f,#view select.f,#view textarea.f{border-radius:14px;min-height:48px}
    #view .grid{gap:12px}
    #view .card .in{padding:11px 12px 13px}
    #view .ph{overflow:hidden;background:var(--panel)}
    #view .ph img{width:100%;height:100%;object-fit:cover}
    nav{padding-bottom:env(safe-area-inset-bottom,0px);background:var(--bar);backdrop-filter:blur(14px);border-top:1px solid var(--line)}
    nav>div{max-width:560px;margin:auto}
    nav button{min-height:58px;transition:color .15s ease}
    nav button[aria-current="page"]{color:var(--pri);font-weight:800}
    #auth{position:fixed;inset:0;z-index:1000;overflow-y:auto;background:var(--bg);padding:calc(16px + env(safe-area-inset-top,0px)) 16px calc(20px + env(safe-area-inset-bottom,0px))}
    body.bilo-auth-open header,body.bilo-auth-open #view,body.bilo-auth-open nav{visibility:hidden}
    #auth .au{width:100%;max-width:460px;min-height:calc(100dvh - 36px);margin:0 auto;justify-content:center}
    #auth .au.c{gap:16px}
    #auth .btn{border-radius:15px;min-height:50px}
    @media(max-width:380px){#view.wrap{padding-left:12px;padding-right:12px}#view .grid{gap:9px}#view .card{border-radius:17px}#view .card .in{padding:9px 10px 11px}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
  `;
  (document.head||document.documentElement).appendChild(style);

  const syncAuthLayer=()=>{
    const auth=document.getElementById("auth");
    const open=!!(auth&&getComputedStyle(auth).display!=="none"&&auth.innerHTML.trim());
    document.body.classList.toggle("bilo-auth-open",open);
  };
  syncAuthLayer();
  if(window.MutationObserver){
    new MutationObserver(syncAuthLayer).observe(document.documentElement,{attributes:true,childList:true,subtree:true,attributeFilter:["style"]});
  }

  /* One consistent Bilocost identity for every in-app request / dialog surface. */
  const requestStyle = document.createElement("style");
  requestStyle.id = "bilocost-request-design";
  requestStyle.textContent = `
    :root{--bilo-green:#16834a;--bilo-green-dark:#10683a;--bilo-green-soft:#eaf6ee;--bilo-ink:#17231c;--bilo-muted:#66736b;--bilo-border:#dce7df;--bilo-surface:#fff}
    dialog[open],[role="dialog"],[role="alertdialog"],.modal,.modal-overlay,.modal-backdrop,.dialog,.dialog-overlay,.popup,.popup-overlay,.sheet,.bottom-sheet,.drawer,.prompt,.confirm,.request-modal,.permission-modal,[class*="modal-"],[class*="-modal"]{font-family:'Plus Jakarta Sans',Inter,system-ui,sans-serif;color:var(--bilo-ink)}
    dialog[open],[role="dialog"],[role="alertdialog"],.modal,.dialog,.popup,.sheet,.bottom-sheet,.drawer,.prompt,.confirm,.request-modal,.permission-modal,[class*="modal-content"],[class*="dialog-content"]{background:var(--bilo-surface)!important;color:var(--bilo-ink)!important;border:1px solid var(--bilo-border)!important;border-radius:22px!important;box-shadow:0 22px 70px rgba(13,38,23,.22)!important;max-width:min(94vw,520px);overflow-wrap:anywhere}
    dialog[open]::backdrop,.modal-overlay,.modal-backdrop,.dialog-overlay,.popup-overlay{background:rgba(10,24,15,.58)!important;-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px)}
    [role="dialog"] h1,[role="dialog"] h2,[role="dialog"] h3,[role="alertdialog"] h1,[role="alertdialog"] h2,[role="alertdialog"] h3,dialog h1,dialog h2,dialog h3,.modal h1,.modal h2,.modal h3,.dialog h1,.dialog h2,.dialog h3,.popup h1,.popup h2,.popup h3,.sheet h1,.sheet h2,.sheet h3{color:var(--bilo-ink)!important;font-weight:800;letter-spacing:-.025em}
    [role="dialog"] p,[role="alertdialog"] p,dialog p,.modal p,.dialog p,.popup p,.sheet p,.prompt p,.confirm p{color:var(--bilo-muted);line-height:1.55}
    [role="dialog"] input,[role="dialog"] select,[role="dialog"] textarea,[role="alertdialog"] input,[role="alertdialog"] select,[role="alertdialog"] textarea,dialog input,dialog select,dialog textarea,.modal input,.modal select,.modal textarea,.dialog input,.dialog select,.dialog textarea,.popup input,.popup select,.popup textarea,.sheet input,.sheet select,.sheet textarea,.prompt input,.prompt select,.prompt textarea,.confirm input,.confirm select,.confirm textarea{width:100%;max-width:100%;min-height:48px;box-sizing:border-box;padding:12px 14px;border:1px solid var(--bilo-border)!important;border-radius:13px!important;background:#fff!important;color:var(--bilo-ink)!important;font:500 14px/1.4 Inter,system-ui,sans-serif;outline:none}
    [role="dialog"] input:focus,[role="dialog"] select:focus,[role="dialog"] textarea:focus,dialog input:focus,dialog select:focus,dialog textarea:focus,.modal input:focus,.modal select:focus,.modal textarea:focus,.dialog input:focus,.dialog select:focus,.dialog textarea:focus{border-color:var(--bilo-green)!important;box-shadow:0 0 0 3px rgba(22,131,74,.12)!important}
    [role="dialog"] button,.modal button,.dialog button,.popup button,.sheet button,.prompt button,.confirm button,dialog button,.request-modal button,.permission-modal button{min-height:44px;border-radius:13px!important;font:700 13px/1.25 'Plus Jakarta Sans',Inter,system-ui,sans-serif;cursor:pointer;transition:transform .15s ease,filter .15s ease}
    [role="dialog"] button:active,.modal button:active,.dialog button:active,.popup button:active,.sheet button:active,dialog button:active{transform:scale(.985)}
    [role="dialog"] button.primary,[role="dialog"] button[type="submit"],.modal button.primary,.modal button[type="submit"],.dialog button.primary,.dialog button[type="submit"],.popup button.primary,.sheet button.primary,.request-modal button.primary,.permission-modal button.primary,dialog button.primary,dialog button[type="submit"]{background:var(--bilo-green)!important;color:#fff!important;border:1px solid var(--bilo-green)!important}
    [role="dialog"] button.secondary,.modal button.secondary,.dialog button.secondary,.popup button.secondary,.sheet button.secondary,dialog button.secondary{background:var(--bilo-green-soft)!important;color:var(--bilo-green-dark)!important;border:1px solid #cfe6d6!important}
    [role="dialog"] label,.modal label,.dialog label,.popup label,.sheet label,dialog label{color:var(--bilo-ink);font-weight:650;font-size:13px}
    @media(max-width:520px){dialog[open],[role="dialog"],[role="alertdialog"],.modal,.dialog,.popup,.prompt,.confirm,.request-modal,.permission-modal,[class*="modal-content"],[class*="dialog-content"]{width:min(94vw,520px)!important;max-width:94vw!important;max-height:calc(100dvh - 28px);overflow-y:auto;border-radius:20px!important}.sheet,.bottom-sheet{width:100%!important;max-width:100%!important;max-height:88dvh;overflow-y:auto;border-radius:22px 22px 0 0!important}}
  `;
  (document.head||document.documentElement).appendChild(requestStyle);

})();
