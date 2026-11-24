from pathlib import Path

html_path = Path("www/index.html")
logo_path = Path("www/bilocost-loader-logo.jpg")
if not html_path.is_file() or not logo_path.is_file() or logo_path.stat().st_size == 0:
    raise SystemExit("android splash prerequisites are missing")
html = html_path.read_text(encoding="utf-8")
style = r"""<style id="bilocost-native-loader-style">
#bilocost-native-loader{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;overflow:hidden;background:#073f30;color:#fff;opacity:1;transition:opacity .45s ease;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
#bilocost-native-loader .bl-wrap{width:min(100%,520px);height:100%;min-height:100svh;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:clamp(28px,7vh,76px) 22px clamp(30px,8vh,90px)}
#bilocost-native-loader .bl-brand{display:flex;flex-direction:column;align-items:center;justify-content:center}
#bilocost-native-loader .bl-mark{width:clamp(112px,26vw,208px);height:clamp(112px,26vw,208px);object-fit:contain;border-radius:28%;filter:drop-shadow(0 12px 24px #001e1680);animation:bl-pop .8s cubic-bezier(.2,.8,.2,1) both}
#bilocost-native-loader .bl-name{font:900 italic clamp(38px,10vw,64px)/1 system-ui,sans-serif;letter-spacing:.055em;margin-top:clamp(24px,5vh,46px);color:#fff}
#bilocost-native-loader .bl-name span{color:#42d883}
#bilocost-native-loader .bl-underline{height:5px;width:min(54vw,250px);background:#f7fff9;margin-top:16px;transform:skewX(-18deg);border-radius:2px;animation:bl-grow .65s .35s both}
#bilocost-native-loader .bl-categories{display:flex;align-items:center;justify-content:space-evenly;gap:clamp(15px,4vw,28px);width:min(78vw,470px);min-height:76px;padding:12px 18px;margin-top:clamp(40px,8vh,78px);box-sizing:border-box;border:1px solid #20a66a55;border-radius:999px;background:#032f25;box-shadow:inset 0 1px 10px #001b1433}
#bilocost-native-loader .bl-cat{width:27px;height:27px;stroke:#277c58;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;opacity:.8;animation:bl-icon 2.5s ease-in-out infinite}
#bilocost-native-loader .bl-cat:nth-child(2){animation-delay:.35s}
#bilocost-native-loader .bl-cat:nth-child(3){animation-delay:.7s}
#bilocost-native-loader .bl-cat:nth-child(4){animation-delay:1.05s}
#bilocost-native-loader .bl-cat:nth-child(5){animation-delay:1.4s}
#bilocost-native-loader .bl-progress{width:min(54vw,250px);height:8px;border-radius:99px;background:#275a49;margin-top:clamp(42px,7vh,66px);overflow:hidden}
#bilocost-native-loader .bl-progress span{display:block;width:36%;height:100%;border-radius:99px;background:#42d883;animation:bl-progress 1.7s ease-in-out infinite}
#bilocost-native-loader .bl-loading{font:800 clamp(13px,3.6vw,17px)/1.3 system-ui,sans-serif;letter-spacing:.16em;color:#75dca4;margin-top:24px}
#bilocost-native-loader .bl-slogan{font:800 clamp(13px,3.8vw,19px)/1.55 system-ui,sans-serif;letter-spacing:.01em;text-transform:uppercase;color:#fff;margin-top:auto;padding-top:36px;max-width:100%}
#bilocost-native-loader .bl-slogan span{color:#62dc91}
#bilocost-native-loader .bl-version{font:500 12px/1.4 system-ui,sans-serif;letter-spacing:.12em;color:#32845e;margin-top:clamp(52px,9vh,100px)}
#bilocost-native-loader.bl-out{opacity:0;pointer-events:none}
@keyframes bl-pop{0%{opacity:0;transform:scale(.72)}70%{opacity:1;transform:scale(1.06)}100%{transform:scale(1)}}
@keyframes bl-grow{from{transform:scaleX(0) skewX(-18deg);transform-origin:left}to{transform:scaleX(1) skewX(-18deg)}}
@keyframes bl-progress{0%{transform:translateX(-110%)}100%{transform:translateX(290%)}}
@keyframes bl-icon{0%,100%{stroke:#277c58;transform:scale(1)}45%{stroke:#e9fff2;transform:scale(1.12)}}
@media(max-height:650px){#bilocost-native-loader .bl-wrap{padding-top:18px;padding-bottom:18px}#bilocost-native-loader .bl-categories{margin-top:22px;min-height:58px}#bilocost-native-loader .bl-progress{margin-top:24px}#bilocost-native-loader .bl-slogan{padding-top:20px}#bilocost-native-loader .bl-version{margin-top:24px}}
@media(prefers-reduced-motion:reduce){#bilocost-native-loader *{animation:none!important;transition:none!important}}
</style>"""
script = r"""<script id="bilocost-native-loader-script">
(() => {
 const cap=window.Capacitor;
 if(!cap||typeof cap.getPlatform!=="function"||cap.getPlatform()!=="android")return;
 if(document.getElementById("bilocost-native-loader"))return;
 const layer=document.createElement("div");
 layer.id="bilocost-native-loader";
 layer.setAttribute("role","status");
 layer.setAttribute("aria-label","Chargement de Bilocost");
 layer.innerHTML='<div class="bl-wrap"><div class="bl-brand"><img class="bl-mark" src="bilocost-loader-logo.jpg" alt="Logo Bilocost"><div class="bl-name">BILO<span>COST</span></div><div class="bl-underline"></div></div><div class="bl-categories" aria-hidden="true"><svg class="bl-cat" viewBox="0 0 24 24"><path d="M4 8h16l-1 12H5L4 8Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2M9 12h6"/></svg><svg class="bl-cat" viewBox="0 0 24 24"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 7 9 5 9-5M3 7v10l9 5 9-5V7M12 12v10"/></svg><svg class="bl-cat" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/></svg><svg class="bl-cat" viewBox="0 0 24 24"><path d="m3 7 6-3 3 3 3-3 6 3-2 6-3-1v9H7v-9l-2 1-2-6Z"/></svg><svg class="bl-cat" viewBox="0 0 24 24"><path d="M20 13 11 22 2 13V4h9l9 9Z"/><circle cx="7" cy="9" r="1.2"/></svg></div><div class="bl-progress" aria-hidden="true"><span></span></div><div class="bl-loading">CHARGEMENT...</div><div class="bl-slogan">NOTRE MARCHÉ. NOTRE PLATEFORME.<br><span>NOTRE AVENIR.</span></div><div class="bl-version">Bilocost v1.0.0</div></div>';
 document.body.appendChild(layer);
 const startedAt=Date.now();let closed=false,readySince=0;
 const close=()=>{if(closed)return;closed=true;layer.classList.add("bl-out");window.setTimeout(()=>layer.remove(),470)};
 const check=()=>{
  if(closed)return;
  const view=document.getElementById("view");
  const ready=document.readyState!=="loading"&&!!view&&(view.childElementCount>0||view.textContent.trim().length>0);
  if(ready){if(!readySince)readySince=Date.now();if(Date.now()-readySince>=650&&Date.now()-startedAt>=1800){close();return}}else readySince=0;
  if(Date.now()-startedAt>=15000){
   const label=layer.querySelector(".bl-loading");if(label)label.textContent="CONNEXION EN COURS...";
   if(ready){close();return}
   if(!layer.querySelector("button")){const retry=document.createElement("button");retry.type="button";retry.textContent="Réessayer";retry.style.cssText="margin-top:16px;padding:10px 22px;border:1px solid #42d883;border-radius:24px;background:#073f30;color:#fff;font-weight:700";retry.addEventListener("click",()=>window.location.reload(),{once:true});layer.querySelector(".bl-wrap").appendChild(retry)}
  }
  window.setTimeout(check,180);
 };
 check();window.addEventListener("pagehide",close,{once:true});
})();
</script>"""
if "bilocost-native-loader-style" not in html:
    if "</head>" not in html: raise SystemExit("android splash: </head> missing")
    html=html.replace("</head>",style+"\n</head>",1)
if "bilocost-native-loader-script" not in html:
    if "</body>" not in html: raise SystemExit("android splash: </body> missing")
    html=html.replace("</body>",script+"\n</body>",1)
html_path.write_text(html,encoding="utf-8")
print("Bilocost green reference launch animation installed for android.")
