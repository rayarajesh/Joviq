"""Builds clean certificate templates from the marketing samples:
removes the grey SAMPLE stamp, the blank answer lines (name, program, dates), the
printed "to" between the dates (it is drawn with the dates so they share one baseline),
the sample QR pattern and the "[Certificate ID]" text.
Run from web/public/assets: python3 ../../scripts/make-certificate-templates.py"""
from PIL import Image, ImageDraw
JOBS = [
    dict(src="training-certificate.png", dst="certificates/training-template.jpg",
         stamp=((800, 640), 440, (247, 900)), keep=[],
         redraw=[],
         lines=[(586, 214, 1386), (631, 981, 1342), (672, 820, 984), (672, 1032, 1200)],
         erase=[(551, 938, 688, 1075), (176, 988, 530, 1022), (990, 650, 1025, 678)]),
    dict(src="internship-certificate.jpg", dst="certificates/internship-template.jpg",
         stamp=((800, 560), 440, (150, 890)), keep=[(990, 835, 1600, 1131)],
         redraw=[(827, 731, 1026)],
         lines=[(518, 214, 1386), (580, 1077, 1350), (619, 790, 952), (620, 1000, 1168)],
         erase=[(538, 768, 675, 904), (163, 818, 517, 851), (957, 598, 992, 625)]),
]
for job in JOBS:
    orig = Image.open(job["src"]).convert("RGB"); im = orig.copy(); px = im.load(); op = orig.load()
    (cx, cy), r, (ymin, ymax) = job["stamp"]
    for y in range(ymin, ymax):
        for x in range(440, 1165):
            if (x - cx) ** 2 + (y - cy) ** 2 > r * r: continue
            if any(a <= x <= c and b <= y <= d for a, b, c, d in job["keep"]): continue
            p = px[x, y]
            if min(p) >= 140 and max(p) - min(p) <= 16 and p != (255, 255, 255):
                px[x, y] = (255, 255, 255)
    # The signature line crosses the stamp: redraw it from its clean left end.
    for yc, xa, xb in job["redraw"]:
        for y in range(yc - 5, yc + 6):
            c = op[xa + 3, y]
            for x in range(xa + 3, xb - 2): px[x, y] = c
    # Blank answer lines: fill each column from just above/below so the faint "J" watermark stays intact.
    for yc, xa, xb in job["lines"]:
        top, bottom = yc - 10, yc + 10
        for x in range(xa, xb + 1):
            a, b = px[x, top], px[x, bottom]
            for y in range(top + 1, bottom):
                t = (y - top) / (bottom - top)
                px[x, y] = tuple(round(u + (v - u) * t) for u, v in zip(a, b))
    d = ImageDraw.Draw(im)
    for box in job["erase"]: d.rectangle(box, fill="white")
    im.save(job["dst"], quality=95)
