"""Render icons/icon.svg to PNGs using headless Chrome (Playwright) + Pillow."""
import pathlib
from playwright.sync_api import sync_playwright
from PIL import Image

root = pathlib.Path(__file__).resolve().parent.parent
svg = (root / "icons" / "icon.svg").read_text()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 512, "height": 512}, device_scale_factor=2)
    pg.set_content(f"<html><body style='margin:0;background:#000'>{svg}</body></html>")
    pg.screenshot(path=str(root / "icons" / "_master.png"), clip={"x": 0, "y": 0, "width": 512, "height": 512})
    b.close()

m = Image.open(root / "icons" / "_master.png").convert("RGB")  # 1024x1024
for s in (180, 192, 512, 167, 152, 120):
    m.resize((s, s), Image.LANCZOS).save(root / "icons" / f"icon-{s}.png", optimize=True)
# maskable: 80% safe zone
bg = Image.new("RGB", (1024, 1024), (18, 6, 7))
inner = m.resize((820, 820), Image.LANCZOS)
bg.paste(inner, (102, 102))
bg.resize((512, 512), Image.LANCZOS).save(root / "icons" / "icon-maskable-512.png", optimize=True)
m.resize((64, 64), Image.LANCZOS).save(root / "icons" / "favicon-64.png")
(root / "icons" / "_master.png").unlink()
print("icons done")
