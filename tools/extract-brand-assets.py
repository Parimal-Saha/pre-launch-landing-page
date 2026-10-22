"""
Extract SUGAR SHADE web assets from the brand identity PDF.

Run from the project root:
    python tools/extract-brand-assets.py

Requires: pypdfium2, pillow, numpy, scipy  (pip install pypdfium2 pillow numpy scipy)

Coordinate system: crop boxes are given in "preview pixels" of a 1000x720 render
of each page (page = 1500x1080 pt, so preview px * 1.5 = pt). Renders happen at
SCALE=6, so preview px -> render px is a factor of 1.5 * 6 = 9.
"""

import os

import numpy as np
import pypdfium2 as pdfium
from PIL import Image
from scipy import ndimage as ndi

PDF_PATH = "Sugar Shade - Brand Identity.pdf"
SCALE = 6.0
K = 1.5 * SCALE  # preview(1000w) px -> render px

Image.MAX_IMAGE_PIXELS = None
pdf = pdfium.PdfDocument(PDF_PATH)

os.makedirs("public/assets/products", exist_ok=True)
os.makedirs("public/assets/stickers", exist_ok=True)


def page(idx, scale=SCALE):
    return pdf[idx - 1].render(scale=scale).to_pil().convert("RGB")


def sample_corner(img, patch=14):
    a = np.asarray(img, np.float32)
    corners = [a[:patch, :patch], a[:patch, -patch:], a[-patch:, :patch], a[-patch:, -patch:]]
    med = np.median(np.concatenate([c.reshape(-1, 3) for c in corners]), axis=0)
    return tuple(int(v) for v in med)


def resize_premult(img, tw):
    """Resize RGBA with premultiplied alpha to avoid halos."""
    tw = min(tw, img.width)
    th = max(1, round(img.height * tw / img.width))
    a = np.asarray(img, np.float32) / 255.0
    rgb, al = a[..., :3], a[..., 3:4]
    prem = Image.fromarray((np.dstack([rgb * al, al]) * 255).astype(np.uint8), "RGBA").resize(
        (tw, th), Image.LANCZOS
    )
    back = np.asarray(prem, np.float32) / 255.0
    alr = back[..., 3:4]
    col = np.clip(back[..., :3] / np.clip(alr, 1e-3, 1), 0, 1)
    return Image.fromarray((np.dstack([col, alr]) * 255).astype(np.uint8), "RGBA")


def flood_key(img, bg=None, near=30, lo=10, hi=45):
    """Make the flat background transparent (flood-filled from the edges)."""
    bg = bg or sample_corner(img)
    a = np.asarray(img.convert("RGB"), np.float32)
    b = np.array(bg, np.float32)
    dist = np.abs(a - b).max(axis=2)
    lab, _n = ndi.label(dist < near)
    border = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
    border.discard(0)
    outer = np.isin(lab, list(border))
    alpha = np.maximum((~outer).astype(np.float32), np.clip((dist - lo) / (hi - lo), 0, 1))
    al = np.clip(alpha, 1e-3, 1)[..., None]
    col = np.clip((a - (1 - al) * b) / al, 0, 255)
    return Image.fromarray(np.dstack([col, alpha * 255]).astype(np.uint8), "RGBA")


def trim_alpha(img, pad=8):
    """Crop transparent padding so cut-outs are sized by the product itself."""
    a = np.asarray(img)[..., 3]
    ys, xs = np.where(a > 10)
    if not len(xs):
        return img
    box = (
        max(0, int(xs.min()) - pad),
        max(0, int(ys.min()) - pad),
        min(img.width, int(xs.max()) + pad),
        min(img.height, int(ys.max()) + pad),
    )
    return img.crop(box)


def flood_key_neutral(img, bg=None, near=26, chroma=10, feather=0.8):
    """Transparent background for products whose own colour is close to the
    backdrop (e.g. the cream Dew The Right Thing bottle).

    The backdrop is neutral grey; the product is warm. Only pixels that are
    both close to the backdrop AND near-neutral may be flooded away, so the
    cream body keeps full opacity instead of dissolving into the key.
    """
    bg = bg or sample_corner(img)
    a = np.asarray(img.convert("RGB"), np.float32)
    b = np.array(bg, np.float32)
    dist = np.abs(a - b).max(axis=2)
    chroma_map = a.max(axis=2) - a.min(axis=2)
    candidate = (dist < near) & (chroma_map < chroma)
    lab, _n = ndi.label(candidate)
    border = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
    border.discard(0)
    outer = np.isin(lab, list(border))
    alpha = np.where(outer, 0.0, 1.0)
    alpha = np.clip(ndi.gaussian_filter(alpha, feather), 0.0, 1.0)
    al = np.clip(alpha, 1e-3, 1)[..., None]
    col = np.clip((a - (1 - al) * b) / al, 0, 255)
    return Image.fromarray(np.dstack([col, alpha * 255]).astype(np.uint8), "RGBA")


def crop(img, box):
    x0, y0, x1, y1 = [round(v * K) for v in box]
    return img.crop((x0, y0, x1, y1))


def downscale_jpg(img, tw, path, q=88):
    tw = min(tw, img.width)
    img.resize((tw, round(img.height * tw / img.width)), Image.LANCZOS).save(path, quality=q)


def auto_erase(img, jobs):
    """Remove stray neighbouring pixels from a crop.

    jobs: list of (preview_window, targets). targets=None fills the whole window
    with the local background colour; otherwise targets is a list of
    (name, rgb, tolerance) and only matching pixels are filled.
    """
    a = np.array(img)  # writable copy
    for window, targets in jobs:
        x0, y0, x1, y1 = [round(v * K) for v in window]
        if x1 <= x0 or y1 <= y0:
            continue
        region = a[y0:y1, x0:x1].astype(int)
        if targets is None:
            mask = np.ones(region.shape[:2], bool)
        else:
            mask = np.zeros(region.shape[:2], bool)
            for _name, rgb, tol in targets:
                mask |= np.abs(region - np.array(rgb)).max(axis=2) < tol
        if mask.any():
            ring = np.concatenate([
                a[max(0, y0 - 16):y0, x0:x1].reshape(-1, 3),
                a[y1:y1 + 16, x0:x1].reshape(-1, 3),
            ])
            fill = np.median(ring, axis=0).astype(np.uint8) if ring.size else np.array([236, 236, 238], np.uint8)
            region[mask] = fill
            a[y0:y1, x0:x1] = region
    return Image.fromarray(a)


def main():
    p2, p3, p5, p6 = page(2), page(3), page(5), page(6)
    p11, p12, p14, p22 = page(11), page(12), page(14), page(22)
    p15, p16, p17, p18, p19 = page(15), page(16), page(17), page(18), page(19)

    # ---------- logos ----------
    lw = flood_key(crop(p2, (255, 205, 745, 515)), near=40, lo=12, hi=50)
    resize_premult(lw, 1400).save("public/assets/logo-wordmark.png")
    li = flood_key(crop(p3, (330, 85, 675, 285)), near=40, lo=12, hi=50)
    resize_premult(li, 1000).save("public/assets/logo-lime-pinkstar.png")
    lp = flood_key(crop(p3, (330, 415, 675, 620)), near=40, lo=12, hi=50)
    resize_premult(lp, 1000).save("public/assets/logo-lime-bluestar.png")
    print("logos done")

    # ---------- favicon: page 5 icon 1 (lime square, pink star) ----------
    fav = crop(p5, (172, 277, 325, 437)).resize((512, 512), Image.LANCZOS)
    fav.save("src/app/icon.png")
    fav.resize((180, 180), Image.LANCZOS).save("src/app/apple-icon.png")
    star = flood_key(crop(p5, (182, 287, 315, 427)), near=40, lo=12, hi=50)
    resize_premult(star, 480).save("public/assets/starburst-pink.png")
    # transparent-background variant (lime chip keyed out) for decorative use
    import numpy as _np
    sa = _np.asarray(Image.open("public/assets/starburst-pink.png").convert("RGBA")).astype(int)
    r, g, b, al = sa[..., 0], sa[..., 1], sa[..., 2], sa[..., 3]
    lime = (abs(r - 215) < 55) & (abs(g - 255) < 55) & (b < 120) & (al > 0)
    sa[..., 3] = _np.where(lime, 0, al)
    mid = (~lime) & (al > 0) & (b < 170) & (abs(r - 215) < 60) & (abs(g - 255) < 60)
    sa[..., 3] = _np.where(mid, _np.clip((b - 60) * 3, 0, 255), sa[..., 3])
    Image.fromarray(sa.astype("uint8"), "RGBA").save("public/assets/starburst-alpha.png")
    print("favicon + starburst done")

    # ---------- seamless mirror-tiled star pattern ----------
    pat = crop(p6, (0, 0, 1000, 720))
    sq = pat.crop((pat.width // 3, pat.height // 4, pat.width // 3 + 1400, pat.height // 4 + 1400))
    sq = sq.resize((1200, 1200), Image.LANCZOS)
    tile = Image.new("RGB", (2400, 2400))
    for i, fx in enumerate([False, True]):
        for j, fy in enumerate([False, True]):
            q = sq.copy()
            if fx:
                q = q.transpose(Image.FLIP_LEFT_RIGHT)
            if fy:
                q = q.transpose(Image.FLIP_TOP_BOTTOM)
            tile.paste(q, (i * 1200, j * 1200))
    tile.save("public/assets/star-pattern.png")
    print("pattern done")

    # ---------- collection scene ----------
    scene = crop(p11, (0, 62, 1000, 652))
    downscale_jpg(scene, 2400, "public/assets/collection-scene.jpg", q=86)
    print("scene done")

    # ---------- product renders (light-gray backdrop kept) ----------
    PURPLE = ("purple", (105, 20, 220), 110)
    PURPLE_DK = ("purple-dk", (35, 5, 105), 75)
    prods = {
        "mark-my-words": ((172, 85, 372, 360), []),
        "dew-the-right-thing": ((378, 160, 602, 592), [
            ((378, 160, 395, 200), None),                       # orange corner sliver
            ((378, 278, 416, 414), None),                       # MMW torus ring + bottle in its hole
            ((584, 352, 602, 378), [                            # indigo wave tip + pink underline
                ("indigo", (70, 80, 200), 80), ("pink", (200, 70, 185), 95),
            ]),
            ((593, 336, 602, 349), None),                       # thin blue stroke at right edge
        ]),
        "drop-dead-gorgeous": ((578, 92, 798, 384), []),
        "no-shade": ((112, 328, 348, 652), [((190, 328, 348, 370), None)]),
        "no-dirt-given": ((700, 212, 938, 608), [
            ((694, 200, 748, 410), None),                       # DDG bottle fragment (label, doodle, flask)
            ((748, 212, 790, 292), [PURPLE, PURPLE_DK, ("purple-sh", (150, 130, 190), 60)]),  # diamond + tip
        ]),
    }
    for name, (box, erases) in prods.items():
        c = crop(p12, box)
        rel = []
        for w, t in erases:
            # absolute preview coords -> crop-relative, clipped to the crop box
            rx0 = max(0.0, w[0] - box[0])
            ry0 = max(0.0, w[1] - box[1])
            rx1 = min(float(box[2] - box[0]), w[2] - box[0])
            ry1 = min(float(box[3] - box[1]), w[3] - box[1])
            if rx1 > rx0 and ry1 > ry0:
                rel.append(((rx0, ry0, rx1, ry1), t))
        if rel:
            c = auto_erase(c, rel)
        downscale_jpg(c, 760, f"public/assets/products/{name}.jpg")
        # transparent cutout for the hero lineup (products stand on the page)
        if name == "dew-the-right-thing":
            cut = flood_key_neutral(c)
        else:
            cut = flood_key(c, near=26, lo=8, hi=42)
        cut = trim_alpha(cut)
        resize_premult(cut, 560).save(f"public/assets/products/{name}-cutout.png")
    print("products + cutouts done")

    # ---------- packaging box (brand-pink backdrop) + 3D star (white backdrop) ----------
    downscale_jpg(crop(p14, (300, 45, 742, 662)), 1000, "public/assets/packaging-box.jpg", q=88)
    downscale_jpg(crop(p22, (330, 175, 680, 535)), 800, "public/assets/star-3d.jpg", q=90)
    print("box + star3d done")

    # ---------- stickers (de-matted from sheet backdrop) ----------
    sticks = [
        (15, (352, 282, 568, 475), "no-dirt-monster", 760),
        (15, (555, 166, 678, 262), "no-dirt-washed-off", 520),
        (15, (310, 486, 430, 576), "no-dirt-label", 500),
        (15, (576, 490, 692, 574), "no-dirt-smileys", 480),
        (16, (432, 262, 600, 455), "mmw-monster", 620),
        (16, (345, 458, 468, 552), "mmw-label", 560),
        (16, (500, 493, 628, 575), "mmw-stretches", 540),
        (17, (418, 176, 604, 518), "ddg-character", 620),
        (17, (338, 382, 444, 562), "ddg-bottle", 440),
        (18, (425, 258, 576, 396), "dtrt-blob", 600),
        (18, (458, 148, 566, 232), "dtrt-text", 480),
        (18, (428, 400, 550, 450), "dtrt-never-greasy", 540),
        (18, (540, 398, 678, 456), "dtrt-moisture", 620),
        (18, (444, 524, 556, 576), "dtrt-sinks-in", 500),
        (19, (414, 234, 572, 396), "no-shade-angel", 620),
        (19, (424, 388, 572, 466), "no-shade-banner", 640),
        (19, (350, 150, 435, 230), "no-shade-thumbsup", 400),
        (19, (558, 284, 652, 386), "no-shade-nope", 420),
    ]
    sheets = {15: p15, 16: p16, 17: p17, 18: p18, 19: p19}
    for pg, box, name, w in sticks:
        c = flood_key(crop(sheets[pg], box), near=26, lo=8, hi=40)
        resize_premult(c, w).save(f"public/assets/stickers/{name}.png")
    print("stickers done")


if __name__ == "__main__":
    main()
