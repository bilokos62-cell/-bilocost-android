#!/usr/bin/env python3
"""Inject a short, local Bilocost launch video without blocking app initialization."""
from pathlib import Path
import sys

target = Path(sys.argv[1] if len(sys.argv) > 1 else "www/index.html")
html = target.read_text(encoding="utf-8")
marker = 'id="bilocost-video-splash"'

if marker in html:
    print("Bilocost video splash already present; no duplicate inserted.")
    raise SystemExit(0)

if "</body>" not in html:
    raise SystemExit("Cannot inject Bilocost video splash: </body> not found.")

splash = r"""
<style id="bilocost-video-splash-style">
  #bilocost-video-splash {
    position: fixed; inset: 0; z-index: 2147483647;
    display: grid; place-items: center; overflow: hidden;
    background: #072e22; opacity: 1;
  }
  #bilocost-video-splash video {
    display: block; width: 100%; height: 100%;
    object-fit: contain; background: #072e22;
  }
</style>
<div id="bilocost-video-splash" role="status" aria-label="Chargement de Bilocost">
  <video autoplay muted playsinline preload="auto" disablepictureinpicture>
    <source src="resources/bilocost-launch.mp4" type="video/mp4">
  </video>
</div>
<script id="bilocost-video-splash-script">
(() => {
  const layer = document.getElementById("bilocost-video-splash");
  if (!layer) return;
  const video = layer.querySelector("video");
  let closed = false;
  let timeoutId;
  const close = () => {
    if (closed) return;
    closed = true;
    if (timeoutId) window.clearTimeout(timeoutId);
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    layer.remove();
  };
  // Never hold the app behind a splash if playback fails or takes too long.
  timeoutId = window.setTimeout(close, 5600);
  video.addEventListener("ended", close, { once: true });
  video.addEventListener("error", close, { once: true });
  window.addEventListener("pagehide", close, { once: true });
  const playback = video.play();
  if (playback && typeof playback.catch === "function") playback.catch(close);
})();
</script>
"""
html = html.replace("</body>", splash + "\n</body>", 1)
target.write_text(html, encoding="utf-8")
print(f"Injected local Bilocost video splash into {target}.")
