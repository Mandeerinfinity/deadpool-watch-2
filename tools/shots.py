"""Curated screenshots of Deadpool Watch 2 (iPhone 15 Pro Max, WebKit, full-screen PWA insets)."""
import sys
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else "https://mandeerinfinity.github.io/deadpool-watch-2/"
out = "/workspace/deadpool-watch-2/screenshots/"
with sync_playwright() as p:
    dev = dict(p.devices["iPhone 15 Pro Max"]); dev.pop("default_browser_type")
    dev["viewport"] = {"width": 430, "height": 932}
    b = p.webkit.launch(); ctx = b.new_context(**dev); pg = ctx.new_page()
    pg.add_init_script("try{localStorage.setItem('dpw2.greeted','true')}catch(e){};document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent=':root{--sat:59px!important;--sab:34px!important}';document.head.appendChild(s)})")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(2500)
    def face(i, name):
        pg.evaluate(f"DP.app.setFace({i})"); pg.wait_for_timeout(5000); pg.screenshot(path=out + name)
    face(4, "01-regenerator-skeleton-face.png")
    face(6, "02-time-jump-hud-face.png")
    pg.evaluate("DP.app.setFace(9)"); pg.wait_for_timeout(1500)
    pg.click("#faceName"); pg.wait_for_timeout(1500); pg.screenshot(path=out + "03-face-picker-13-faces.png")
    pg.evaluate("document.querySelector('#facePicker').hidden=true"); pg.wait_for_timeout(500)
    pg.evaluate("DP.games.start('slice')"); pg.wait_for_timeout(3200)
    gb = pg.locator("#gameCanvas").bounding_box(); y = gb["y"] + gb["height"] * 0.45
    pg.mouse.move(gb["x"] + 40, y + 80); pg.mouse.down()
    for i in range(1, 10): pg.mouse.move(gb["x"] + 40 + (gb["width"] - 80) * i / 10, y + 80 - 160 * i / 10); pg.wait_for_timeout(16)
    pg.screenshot(path=out + "04-katana-slice-game.png"); pg.mouse.up()
    pg.click("#gQuit"); pg.wait_for_timeout(900)
    pg.click('.dock button[data-g="world"]'); pg.wait_for_timeout(3500); pg.screenshot(path=out + "05-weather-multiverse.png")
    pg.click('.dock button[data-g="hub"]'); pg.wait_for_timeout(4000); pg.screenshot(path=out + "06-hub.png")
    print("errors:", errs); b.close()
