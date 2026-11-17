# Draws the Packet Lens app icon (1024x1024, no alpha) and the splash image.
# Usage: python scripts/icon.py <icon.png> <splash.png>
from PIL import Image, ImageDraw, ImageFilter
import sys

S = 1024
img = Image.new('RGB', (S, S))
d = ImageDraw.Draw(img)
for y in range(S):
    t = y / S
    d.line([(0, y), (S, y)], fill=(int(8 + 10 * t), int(22 + 30 * t), int(36 + 40 * t)))

glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse([200, 160, 840, 800], fill=(40, 220, 190, 70))
glow = glow.filter(ImageFilter.GaussianBlur(130))
img.paste(glow, (0, 0), glow)
d = ImageDraw.Draw(img)

# packet rows (like a packet list), coloured like protocol badges
rows = [(180, (88, 214, 141), 520), (300, (93, 173, 236), 610), (420, (245, 203, 92), 460), (540, (236, 112, 99), 560), (660, (175, 122, 197), 420)]
for y, col, w in rows:
    d.rounded_rectangle([150, y, 150 + 70, y + 64], radius=18, fill=col)
    d.rounded_rectangle([250, y + 8, 250 + w, y + 56], radius=22, fill=(52, 72, 92))

# lens
cx, cy, r = 600, 500, 215
shadow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.ellipse([cx - r + 18, cy - r + 26, cx + r + 18, cy + r + 26], fill=(0, 0, 0, 120))
shadow = shadow.filter(ImageFilter.GaussianBlur(18))
img.paste(shadow, (0, 0), shadow)
d = ImageDraw.Draw(img)
# handle
d.line([(cx + 140, cy + 140), (cx + 300, cy + 300)], fill=(20, 30, 40), width=96)
d.line([(cx + 150, cy + 150), (cx + 290, cy + 290)], fill=(230, 236, 240), width=70)
# glass: magnified packet row inside
inner = Image.new('RGB', (2 * r, 2 * r), (232, 250, 246))
idr = ImageDraw.Draw(inner)
idr.rounded_rectangle([40, r - 70, 40 + 110, r + 30], radius=26, fill=(88, 214, 141))
idr.rounded_rectangle([180, r - 58, 2 * r - 40, r + 18], radius=34, fill=(40, 70, 90))
idr.rounded_rectangle([40, r + 70, 2 * r - 120, r + 112], radius=20, fill=(160, 190, 200))
idr.rounded_rectangle([40, r - 170, 2 * r - 160, r - 128], radius=20, fill=(160, 190, 200))
mask = Image.new('L', (2 * r, 2 * r), 0)
ImageDraw.Draw(mask).ellipse([0, 0, 2 * r - 1, 2 * r - 1], fill=255)
img.paste(inner, (cx - r, cy - r), mask)
d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(230, 236, 240), width=44)
d.ellipse([cx - r - 6, cy - r - 6, cx + r + 6, cy + r + 6], outline=(20, 30, 40), width=8)
img.save(sys.argv[1])

sp = Image.new('RGB', (2732, 2732), (11, 11, 15))
small = img.resize((360, 360), Image.LANCZOS)
m = Image.new('L', (360, 360), 0)
ImageDraw.Draw(m).rounded_rectangle([0, 0, 359, 359], radius=80, fill=255)
sp.paste(small, (1186, 1186), m)
sp.save(sys.argv[2])
