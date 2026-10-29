# /// script
# dependencies = ["pillow"]
# ///
"""Draw the toolbar icon as 16x16 pixel art and scale it up.

Run from the repo root: uv run tools/make-icons.py
"""
from PIL import Image

PANEL, HI, LO = (22, 20, 15, 255), (74, 66, 50, 255), (0, 0, 0, 255)
INK, CUT, LED = (255, 176, 0, 255), (90, 86, 78, 255), (255, 90, 31, 255)
CAP_Y = 6
BARS = [3, 5, 6, 2]  # blocks per bar

px = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
for x in range(16):
    for y in range(16):
        if x in (0, 15) and y in (0, 15):
            continue  # rounded corners
        if x == 0 or y == 0:
            px.putpixel((x, y), HI)
        elif x == 15 or y == 15:
            px.putpixel((x, y), LO)
        else:
            px.putpixel((x, y), PANEL)

for i, blocks in enumerate(BARS):
    for k in range(blocks):
        y = 13 - 2 * k
        for x in (3 + 3 * i, 4 + 3 * i):
            px.putpixel((x, y), CUT if y < CAP_Y else INK)
for x in range(2, 15):
    px.putpixel((x, CAP_Y), LED)

for size in (16, 32, 48, 128):
    px.resize((size, size), Image.NEAREST).save(f"icons/icon-{size}.png")
