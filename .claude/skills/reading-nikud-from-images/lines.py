#!/usr/bin/env python3
"""Split a page image into text lines and save each one upscaled, for a
mark-by-mark read of pointed (nikud) text.

  python3 -I lines.py PAGE.png OUT_DIR [--scale 2] [--min-gap 6] [--pad 10]
  python3 -I lines.py PAGE.png OUT_DIR --word X0 X1 Y0 Y1 --scale 4   # one region, fractions of width/height

Lines are found from the row ink profile: a band of rows with dark pixels,
separated by at least --min-gap empty rows. Nikud sits above and below the
letters, so the padding keeps it; a mark that falls into the next band is
the main reason to re-check a line's neighbours. Prints one row per line:
index, y-range, ink height, file.
"""
import sys
from PIL import Image

def main():
    a = sys.argv[1:]
    if len(a) < 2:
        print(__doc__); sys.exit(1)
    page, out = a[0], a[1]
    opt = lambda k, d: type(d)(a[a.index(k) + 1]) if k in a else d
    scale, gap, pad = opt("--scale", 2), opt("--min-gap", 6), opt("--pad", 10)
    im = Image.open(page).convert("L")
    w, h = im.size
    if "--word" in a:
        i = a.index("--word")
        x0, x1, y0, y1 = (float(v) for v in a[i + 1:i + 5])
        c = im.crop((int(w * x0), int(h * y0), int(w * x1), int(h * y1)))
        p = f"{out}/word.png"
        c.resize((c.width * scale, c.height * scale), Image.LANCZOS).save(p)
        print(p); return
    px = im.load()
    # ink per row, ignoring the faint watermark (light grey) and page margins
    ink = [sum(1 for x in range(int(w * 0.05), int(w * 0.95)) if px[x, y] < 110) for y in range(h)]
    bands, start, blank = [], None, 0
    for y, n in enumerate(ink):
        if n > 2:
            if start is None: start = y
            blank = 0
        elif start is not None:
            blank += 1
            if blank >= gap:
                bands.append((start, y - blank)); start, blank = None, 0
    if start is not None: bands.append((start, h - 1))
    bands = [b for b in bands if b[1] - b[0] >= 8]  # drop specks
    for i, (y0, y1) in enumerate(bands):
        c = im.crop((0, max(0, y0 - pad), w, min(h, y1 + pad)))
        p = f"{out}/line{i:02d}.png"
        c.resize((c.width * scale, c.height * scale), Image.LANCZOS).save(p)
        print(f"{i:02d}  y={y0}-{y1}  h={y1 - y0}  {p}")

main()
