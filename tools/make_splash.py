"""Render the Deadpool Watch 2 iOS launch image (1290x2796) for iPhone 15 Pro Max."""
import pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
svg = (root / "icons" / "icon.svg").read_text()
font = (root / "fonts" / "Bangers-Regular.woff2").as_uri()
html = f"""<html><head><style>@font-face{{font-family:B;src:url('{font}')}}
body{{margin:0;width:430px;height:932px;background:radial-gradient(120% 60% at 50% 35%,#3a0a0e,#0a0506 60%,#050505);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:B;color:#fff}}
svg{{width:220px;height:220px;filter:drop-shadow(0 20px 40px rgba(0,0,0,.7))}}
h1{{font-weight:normal;font-size:52px;margin:26px 0 0;letter-spacing:2px;transform:skew(-6deg);text-shadow:3px 3px 0 #000,6px 6px 0 #d1121c}}
p{{font-size:20px;letter-spacing:3px;color:#ff3b44;margin:10px 0 0}}</style></head>
<body>{svg}<h1>DEADPOOL WATCH <span style="color:#ffc814">2</span></h1><p>MAXIMUM EFFORT. AGAIN.</p></body></html>"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox", "--allow-file-access-from-files"])
    pg = b.new_page(viewport={"width": 430, "height": 932}, device_scale_factor=3)
    tmp = root / "tools" / "_splash.html"; tmp.write_text(html)
    pg.goto(tmp.as_uri()); pg.wait_for_timeout(400)
    pg.screenshot(path=str(root / "icons" / "splash-1290x2796.png"))
    tmp.unlink(); b.close()
print("splash done")
