# Draws the iPhone app icon (1024, no alpha — App Store requirement) and the
# launch screen, from the same tile as public/icon-512.png, at full resolution.
#   python3 mobile/make-art.py
from PIL import Image, ImageDraw

COBALT = (29, 79, 150)
LIGHT = (127, 176, 227)
WHITE = (255, 255, 255)
BG = (244, 247, 250)
# TileStar's path (components and mobile/src/App.tsx), in a 24-unit box
STAR = [(12, 2), (14.6, 6.2), (19.1, 4.9), (17.8, 9.4), (22, 12), (17.8, 14.6), (19.1, 19.1), (14.6, 17.8),
        (12, 22), (9.4, 17.8), (4.9, 19.1), (6.2, 14.6), (2, 12), (6.2, 9.4), (4.9, 4.9), (9.4, 6.2)]

def star(d, cx, cy, scale, fill, hole, hole_r):
    d.polygon([(cx + (x - 12) * scale, cy + (y - 12) * scale) for x, y in STAR], fill=fill)
    d.ellipse([cx - hole_r, cy - hole_r, cx + hole_r, cy + hole_r], fill=hole)

def icon(size=1024, ss=4):
    S = size * ss
    k = S / 512  # measurements below are on the 512 original
    im = Image.new("RGB", (S, S), COBALT)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([41 * k, 41 * k, (512 - 41) * k, (512 - 41) * k], radius=62 * k, outline=WHITE, width=round(9 * k))
    d.rounded_rectangle([59 * k, 59 * k, (512 - 59) * k, (512 - 59) * k], radius=46 * k, outline=LIGHT, width=round(4 * k))
    star(d, S / 2, S / 2, 13.9 * k, WHITE, COBALT, 39 * k)
    return im.resize((size, size), Image.LANCZOS)

def splash(size=2732, ss=2):
    S = size * ss
    im = Image.new("RGB", (S, S), BG)
    d = ImageDraw.Draw(im)
    star(d, S / 2, S / 2, 9 * ss, COBALT, BG, 2.9 * 9 * ss)
    return im.resize((size, size), Image.LANCZOS)

base = "mobile/ios/App/App/Assets.xcassets"
icon().save(f"{base}/AppIcon.appiconset/AppIcon-512@2x.png")
s = splash()
for n in ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]:
    s.save(f"{base}/Splash.imageset/{n}")
print("icon + splash written")
