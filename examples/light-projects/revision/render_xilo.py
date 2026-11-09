"""Use upstream xilo renderer with Canvas-only Chrome flags on this Windows host."""
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'vendor/xilo-opus-video/skills/xilo-opus-video/scripts'))
import render
# GPU-enabled Chrome stalled during parallel previews on this host.
# The composition is Canvas 2D; hardware WebGL is unnecessary here.
render.GPU_ARGS[:]=['--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']
render.main()
