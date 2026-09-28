"""Deadpool Watch 2 headless smoke test: iPhone 15 Pro Max profile (WebKit + Chrome).
usage: python3 tools/test_app.py URL [shots] [webkit|chrome|both]"""
import sys, json
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8842/"
SHOTS = len(sys.argv) > 2 and sys.argv[2] == "shots"
ENG = sys.argv[3] if len(sys.argv) > 3 else "both"
out = "/workspace/deadpool-watch-2/screenshots/raw/"
import os; os.makedirs(out, exist_ok=True)
def run(p, engine):
    dev = dict(p.devices["iPhone 15 Pro Max"]); dev.pop("default_browser_type", None)
    if engine == "chrome":
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    else:
        b = p.webkit.launch()
    if SHOTS: dev["viewport"] = {"width": 430, "height": 932}
    ctx = b.new_context(**dev, geolocation={"latitude": 41.88, "longitude": -87.63}, permissions=["geolocation"] if engine == "chrome" else [])
    pg = ctx.new_page()
    if SHOTS:
        pg.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent=':root{--sat:59px!important;--sab:34px!important}';document.head.appendChild(s)})")
    errs = []
    pg.on("console", lambda m: errs.append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    pg.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
    pg.on("requestfailed", lambda r: errs.append(f"requestfailed: {r.url} {r.failure}"))
    def shot(name):
        if SHOTS: pg.wait_for_timeout(400); pg.screenshot(path=out + f"{name}-{engine}.png")
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(1800)
    R = {"engine": engine, "viewport": pg.viewport_size}
    R["title"] = pg.title()
    R["nFaces"] = pg.evaluate("document.querySelectorAll('#facesTrack .face').length")
    R["gl"] = pg.evaluate("!!(DP.gl && DP.gl.ok)")
    shot("01-classic")
    box = pg.locator("#facesVp").bounding_box(); cx, cy = box["x"] + box["width"]/2, box["y"] + box["height"]/2
    def swipe(dx):
        pg.mouse.move(cx, cy); pg.mouse.down()
        for i in range(1, 9): pg.mouse.move(cx + dx*i/8, cy); pg.wait_for_timeout(12)
        pg.mouse.up(); pg.wait_for_timeout(800)
    swipe(-220); R["afterSwipe"] = pg.evaluate("DP.app.faceIdx")
    names = []
    for i in range(R["nFaces"]):
        pg.evaluate(f"DP.app.setFace({i})"); pg.wait_for_timeout(900)
        names.append(pg.evaluate("document.querySelector('#faceName').textContent.trim()"))
        if i >= 4: shot(f"face{i:02d}")
        pg.mouse.click(cx, cy); pg.wait_for_timeout(250)
    R["faceNames"] = names
    R["bubble"] = pg.evaluate("(document.querySelector('.bubble')||{}).textContent||null")
    pg.evaluate("DP.app.setFace(5)"); pg.wait_for_timeout(700); pg.mouse.click(cx, cy); pg.wait_for_timeout(1300)
    R["chronoRunning"] = pg.evaluate("DP.sw.running()"); R["chronoElapsed"] = pg.evaluate("Math.round(DP.sw.elapsed())"); pg.evaluate("DP.sw.running() && DP.sw.toggle()")
    pg.evaluate("DP.app.setFace(0)"); pg.wait_for_timeout(600)
    pg.click("#faceName"); pg.wait_for_timeout(700); R["picker"] = pg.evaluate("!document.querySelector('#facePicker').hidden && document.querySelectorAll('#fpGrid > *').length"); shot("02-picker")
    pg.keyboard.press("Escape"); pg.evaluate("document.querySelector('#facePicker').hidden=true"); pg.wait_for_timeout(300)
    for _ in range(5): pg.click("#crown", force=True); pg.wait_for_timeout(90)
    pg.wait_for_timeout(1200); R["flipped"] = pg.evaluate("document.querySelector('#flipper').className"); shot("03-caseback")
    pg.click("#crown", force=True); pg.wait_for_timeout(900)
    pg.click("#btnWall"); pg.wait_for_timeout(1500); pg.wait_for_timeout(2500)
    # timers
    pg.click('.dock button[data-g="timers"]'); pg.wait_for_timeout(900)
    pg.evaluate("DP.core.go('scr-focus')"); pg.wait_for_timeout(900); pg.click("#focusGo"); pg.wait_for_timeout(1500)
    R["focusTime"] = pg.inner_text("#focusTime"); shot("04-focus"); pg.click("#focusReset")
    pg.evaluate("DP.core.go('scr-interval')"); pg.wait_for_timeout(900); pg.click("#ivGo"); pg.wait_for_timeout(1600)
    R["ivPhase"] = pg.inner_text("#ivPhase") + " " + pg.inner_text("#ivTime"); shot("05-interval"); pg.click("#ivReset")
    pg.evaluate("DP.core.go('scr-countdown')"); pg.wait_for_timeout(900)
    q = pg.locator("#cdQuick button").first
    if q.count(): q.click(); pg.wait_for_timeout(600)
    R["countdowns"] = pg.evaluate("document.querySelectorAll('#cdList > *').length"); shot("06-countdown")
    # games
    pg.click('.dock button[data-g="games"]'); pg.wait_for_timeout(900); shot("07-arcade")
    pg.evaluate("DP.games.start('slice')"); pg.wait_for_timeout(2500)
    gb = pg.locator("#gameCanvas").bounding_box()
    for k in range(6):
        y = gb["y"] + gb["height"]*(0.3 + 0.08*k)
        pg.mouse.move(gb["x"]+20, y); pg.mouse.down()
        for i in range(1, 12): pg.mouse.move(gb["x"]+20 + (gb["width"]-40)*i/11, y - 60*i/11); pg.wait_for_timeout(10)
        pg.mouse.up(); pg.wait_for_timeout(250)
    R["sliceScore"] = pg.inner_text("#gScore"); shot("08-slice")
    pg.click("#gQuit"); pg.wait_for_timeout(800)
    pg.evaluate("DP.games.start('bullet')"); pg.wait_for_timeout(1500); shot("09-bullet")
    R["bulletActive"] = pg.evaluate("DP.games.active"); pg.click("#gQuit"); pg.wait_for_timeout(800)
    R["gamingOff"] = pg.evaluate("!document.documentElement.classList.contains('gaming')")
    # world
    pg.click('.dock button[data-g="world"]'); pg.wait_for_timeout(1000)
    pg.click("#wxRefresh"); pg.wait_for_timeout(4000)
    R["weather"] = pg.evaluate("[wxTemp.textContent, wxDesc.textContent, wxLoc.textContent, wxMoon.textContent, wxStatus.textContent].join(' | ')"); shot("10-world")
    # hub
    pg.click('.dock button[data-g="hub"]'); pg.wait_for_timeout(900); shot("11-hub")
    R["hubTiles"] = pg.evaluate("document.querySelectorAll('#hubGrid .hub-tile').length")
    pg.click('.hub-tile[data-hub="scr-horo"]'); pg.wait_for_timeout(900)
    pg.locator("#signGrid button").nth(4).click(); pg.wait_for_timeout(700)
    R["horo"] = pg.inner_text("#horoCard")[:120]; shot("12-horo")
    pg.evaluate("DP.core.go('scr-mood')"); pg.wait_for_timeout(900); pg.locator("#moodRow button").nth(1).click(); pg.wait_for_timeout(600)
    R["mood"] = pg.inner_text("#moodReply")[:100]; shot("13-mood")
    pg.evaluate("DP.core.go('scr-custom')"); pg.wait_for_timeout(900); pg.locator("#swatches button").nth(2).click(); pg.wait_for_timeout(600); shot("14-custom")
    pg.locator("#swatches button").nth(0).click()
    pg.evaluate("DP.core.go('scr-ach')"); pg.wait_for_timeout(900)
    R["ach"] = pg.inner_text("#achCount"); shot("15-ach")
    pg.evaluate("DP.core.go('scr-vitals')"); pg.wait_for_timeout(900); R["eggs"] = pg.inner_text("#eggCount"); shot("16-vitals")
    pg.evaluate("DP.core.go('scr-settings')"); pg.wait_for_timeout(900); shot("17-settings")
    pg.evaluate("DP.tools.light(true)"); pg.wait_for_timeout(800); R["light"] = pg.evaluate("!document.querySelector('#lightLayer').hidden"); shot("18-light")
    pg.click("#lightClose"); pg.wait_for_timeout(500)
    pg.evaluate("DP.core.go('scr-watch')"); pg.wait_for_timeout(900)
    pg.evaluate("DP.core.speak && DP.core.speak('Maximum effort, again.')")
    R["sw"] = pg.evaluate("navigator.serviceWorker ? navigator.serviceWorker.getRegistration().then(r => !!r) : 'n/a'")
    R["manifest"] = pg.evaluate("fetch('manifest.json').then(r=>r.json()).then(m=>[m.name,m.short_name,m.id,m.start_url].join(' / '))")
    R["cacheKeys"] = pg.evaluate("self.caches ? caches.keys() : 'n/a'")
    R["errors"] = errs
    b.close(); return R
with sync_playwright() as p:
    for e in (["webkit", "chrome"] if ENG == "both" else [ENG]):
        try: print(json.dumps(run(p, e), indent=1))
        except Exception as ex: print(e, "FAILED:", repr(ex)[:800])
