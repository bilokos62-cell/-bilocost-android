from pathlib import Path

html_path = Path("www/index.html")
logo_path = Path("www/bilocost-loader-logo.jpg")
if not html_path.is_file() or not logo_path.is_file() or logo_path.stat().st_size == 0:
    raise SystemExit("Android splash prerequisites are missing")
html = html_path.read_text(encoding="utf-8")
style = r"""<style id="bilocost-native-loader-style">
#bilocost-native-loader{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;overflow:hidden;background:#d18f9f;color:#ffffff;opacity:1;transition:opacity .42s ease}
#bilocost-native-loader:before,#bilocost-native-loader:after{content:"";position:absolute;display:none}
#bilocost-native-loader:after{display:none}
#bilocost-native-loader .bl-wrap{position:relative;z-index:1;width:min(88vw,420px);display:flex;flex-direction:column;align-items:center;text-align:center;padding:24px 18px}
#bilocost-native-loader .bl-mark{width:clamp(180px,48vw,240px);height:clamp(180px,48vw,240px);object-fit:contain;border-radius:28px;filter:none;animation:none}
#bilocost-native-loader .bl-name{font:800 clamp(32px,9vw,42px)/1.1 system-ui,sans-serif;letter-spacing:0;margin-top:18px;color:#ffffff;text-shadow:none;animation:none}
#bilocost-native-loader .bl-tag{font:700 10px/1.6 system-ui,sans-serif;letter-spacing:2px;color:#ffffff;margin-top:9px;animation:bl-rise .55s .32s both}
#bilocost-native-loader .bl-slogan{font:600 12px/1.5 system-ui,sans-serif;color:#ffffff;margin-top:18px;letter-spacing:.25px;animation:bl-rise .55s .42s both}
#bilocost-native-loader .bl-track{height:4px;width:min(68vw,270px);border-radius:10px;background:rgba(255,255,255,.30);overflow:hidden;margin-top:29px}
#bilocost-native-loader .bl-fill{height:100%;width:38%;border-radius:10px;background:#ffffff;box-shadow:0 0 12px rgba(134,255,157,.7);animation:bl-progress 1.25s ease-in-out infinite alternate}
#bilocost-native-loader .bl-caption{font:500 11px/1.4 system-ui,sans-serif;color:#ffffff;margin-top:11px}
#bilocost-native-loader.bl-out{opacity:0;pointer-events:none}
@keyframes bl-arrive{0%{opacity:0;transform:scale(.72) rotate(-7deg)}70%{opacity:1;transform:scale(1.05) rotate(1deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
@keyframes bl-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes bl-float{50%{transform:translateY(-5px)}}
@keyframes bl-progress{from{transform:translateX(-35%)}to{transform:translateX(210%)}}
@keyframes bl-orbit{to{transform:rotate(360deg)}}
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
 layer.innerHTML='<div class="bl-wrap"><img class="bl-mark" src="bilocost-loader-logo.jpg" alt="Bilocost"><div class="bl-name">Bilocost</div><div class="bl-tag">L\'ACHAT À BAS PRIX !</div><div class="bl-slogan">Notre marché. Notre plateforme. Notre avenir.</div><div class="bl-track" aria-hidden="true"><div class="bl-fill"></div></div><div class="bl-caption">Préparation de votre espace Bilocost…</div></div>';
 document.body.appendChild(layer);
 const startedAt=Date.now();let closed=false,readySince=0;
 const close=()=>{if(closed)return;closed=true;layer.classList.add("bl-out");window.setTimeout(()=>layer.remove(),460)};
 const check=()=>{
  if(closed)return;
  const view=document.getElementById("view");
  const ready=document.readyState!=="loading"&&!!view&&(view.childElementCount>0||view.textContent.trim().length>0);
  if(ready){if(!readySince)readySince=Date.now();if(Date.now()-readySince>=500&&Date.now()-startedAt>=1400){close();return}}else readySince=0;
  if(Date.now()-startedAt>=10000){
   const caption=layer.querySelector(".bl-caption");if(caption)caption.textContent="Le chargement continue…";
   if(ready){close();return}
   if(!layer.querySelector("button")){const retry=document.createElement("button");retry.type="button";retry.textContent="Réessayer";retry.style.cssText="margin-top:18px;padding:10px 20px;border:1px solid #b9f5d0;border-radius:24px;background:#ffffff;color:#087542;font-weight:700";retry.addEventListener("click",()=>window.location.reload(),{once:true});layer.querySelector(".bl-wrap").appendChild(retry)}
  }
  window.setTimeout(check,160);
 };
 check();window.addEventListener("pagehide",close,{once:true});
})();
</script>"""
if "bilocost-native-loader-style" not in html:
    if "</head>" not in html: raise SystemExit("Android splash: </head> missing")
    html=html.replace("</head>",style+"\n</head>",1)
if "bilocost-native-loader-script" not in html:
    if "</body>" not in html: raise SystemExit("Android splash: </body> missing")
    html=html.replace("</body>",script+"\n</body>",1)
html_path.write_text(html,encoding="utf-8")
print("Native Bilocost splash installed; legacy video playback removed.")
