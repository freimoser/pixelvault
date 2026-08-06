# pixelvault

Private Bildergalerie & Bild-CDN auf GitHub Pages. Dient dazu, eigene PNGs/Bilder per Git hochzuladen und sie direkt per URL in Metabase-Dashboards oder anderen Tools einzubinden.

Live: https://freemoser.github.io/pixelvault/

## Neues Bild hinzufügen

1. Bilddatei nach `images/` legen (PNG, JPG, GIF, WebP, SVG, AVIF).
2. Committen & pushen:

   ```bash
   git add images/mein-bild.png
   git commit -m "Add mein-bild"
   git push
   ```

3. Fertig — die Galerie liest den Ordnerinhalt live über die GitHub API und zeigt das Bild ohne Build-Schritt an.

## Bild-URL für Metabase & Co.

Jedes Bild ist direkt erreichbar unter:

```
https://raw.githubusercontent.com/Freemoser/pixelvault/main/images/<dateiname>
```

Auf der Galerie-Seite kopiert der "Kopieren"-Button pro Bild automatisch diese URL in die Zwischenablage.

## Hinweis zur Sichtbarkeit

Das Repo ist öffentlich, da GitHub Pages + direktes Hotlinking (raw.githubusercontent.com) für kostenlose Accounts nur bei öffentlichen Repos zuverlässig funktioniert. Die Bilder sind damit über die direkte URL erreichbar, werden aber nirgends aktiv beworben oder indexiert (`robots: noindex`).

## Tech

Reines statisches HTML/CSS/JS, kein Build-Schritt, keine Abhängigkeiten. Die Startseite fragt die GitHub Contents API für `images/` ab und rendert die Galerie client-seitig.
