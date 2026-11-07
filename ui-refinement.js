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
})();
