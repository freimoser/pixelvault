"""Erzeugt kleine WebP-Vorschaubilder für die Galerie.

Läuft im Deploy-Workflow, nicht lokal: Die Vorschauen landen im ausgelieferten
Artefakt unter thumbs/, werden aber nie committet. So bleibt das Repo frei von
abgeleiteten Dateien, und eine Vorschau kann nie veralten, weil sie bei jedem
Deploy neu entsteht.

Warum überhaupt: Die Galerie lud für eine 200 Pixel breite Kachel das volle
Original — beim einzigen Bild 1,1 MB. Lighthouse maß dafür 7,5 s bis zum
größten sichtbaren Element. Die Originale bleiben unverändert unter ihrer
raw-Adresse, damit keine Einbettung in Metabase bricht.

Aufruf: python3 scripts/thumbs.py
"""
from pathlib import Path

from PIL import Image, ImageOps

SRC = Path("images")
DST = Path("thumbs")
MAX_WIDTH = 480  # doppelte Kachelbreite, damit es auf Retina-Displays scharf bleibt
QUALITY = 78
# SVG ist schon klein und verlustfrei skalierbar; die Galerie lädt es direkt.
SKIP = {".svg"}
EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"}


def main() -> None:
    DST.mkdir(exist_ok=True)
    made = 0
    for src in sorted(SRC.iterdir()):
        ext = src.suffix.lower()
        if not src.is_file() or ext not in EXTS or ext in SKIP:
            continue
        try:
            with Image.open(src) as im:
                im = ImageOps.exif_transpose(im)
                # Animierte GIFs: erstes Bild genügt als Vorschau.
                im.seek(0)
                if im.width > MAX_WIDTH:
                    h = round(im.height * MAX_WIDTH / im.width)
                    im = im.resize((MAX_WIDTH, h), Image.LANCZOS)
                if im.mode not in ("RGB", "RGBA"):
                    im = im.convert("RGBA")
                out = DST / f"{src.name}.webp"
                im.save(out, "WEBP", quality=QUALITY, method=6)
        except Exception as err:  # ein kaputtes Bild darf den Deploy nicht stoppen
            print(f"übersprungen: {src.name} ({err})")
            continue
        made += 1
        print(f"{src.name}: {src.stat().st_size // 1000} KB -> {out.stat().st_size // 1000} KB")
    print(f"{made} Vorschaubild(er) erzeugt")


if __name__ == "__main__":
    main()
