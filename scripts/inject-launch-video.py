#!/usr/bin/env python3
"""Inject a fail-open local video splash into the packaged Bilocost WebView."""
from pathlib import Path
import sys

target = Path(sys.argv[1] if len(sys.argv) > 1 else "www/index.html")
html = target.read_text(encoding="utf-8")
if 'id="bilocost-video-splash"' in html:
    print("Bilocost loading video already injected.")
    raise SystemExit(0)
if "</body>" not in html:
    raise SystemExit("Cannot inject loading video: </body> not found.")
splash = r"""
<style id="bilocost-video-splash-style">
#bilocost-video-splash{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;overflow:hidden;background:#062f23;opacity:1;transition:opacity .18s ease}
#bilocost-video-splash video{display:block;width:100%;height:100%;object-fit:contain;background:#062f23}
</style>
<div id="bilocost-video-splash" role="status" aria-label="Chargement de Bilocost">
<video muted playsinline webkit-playsinline autoplay preload="auto" disablepictureinpicture>
<source src="resources/bilocost-launch.mp4" type="video/mp4">
</video></div>
<script id="bilocost-video-splash-script">
(()=>{
 const layer=document.getElementById("bilocost-video-splash");if(!layer)return;
 const video=layer.querySelector("video");let closed=false,timer=0;
 const close=()=>{if(closed)return;closed=true;if(timer)clearTimeout(timer);layer.style.opacity="0";video.pause();setTimeout(()=>layer.remove(),200);};
 // Cosmetic only: a failed or blocked video must never block the app or login.
 timer=setTimeout(close,7500);
 video.addEventListener("ended",close,{once:true});
 video.addEventListener("error",close,{once:true});
 window.addEventListener("pagehide",close,{once:true});
 try{const p=video.play();if(p&&typeof p.catch==="function")p.catch(close);}catch(_){close();}
})();
</script>
"""
target.write_text(html.replace("</body>", splash + "\n</body>", 1), encoding="utf-8")
print("Fail-open Bilocost loading video injected.")
