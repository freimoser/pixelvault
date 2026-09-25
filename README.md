# pixelvault

Private Bildergalerie & Bild-CDN auf GitHub Pages. Dient dazu, eigene PNGs/Bilder per Git hochzuladen und sie direkt per URL in Metabase-Dashboards oder anderen Tools einzubinden.

Live: https://freimoser.github.io/pixelvault/

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
https://raw.githubusercontent.com/freimoser/pixelvault/main/images/<dateiname>
```

Auf der Galerie-Seite kopiert der "Kopieren"-Button pro Bild automatisch diese URL in die Zwischenablage.

## Hinweis zur Sichtbarkeit

Das Repo ist öffentlich, da GitHub Pages + direktes Hotlinking (raw.githubusercontent.com) für kostenlose Accounts nur bei öffentlichen Repos zuverlässig funktioniert.

Was die Seite aus Suchmaschinen heraushält, sind die `noindex`-Meta-Tags in den HTML-Dateien. Eine `robots.txt` hilft hier **nicht**: Crawler lesen sie nur an der Wurzel des Hosts (`freimoser.github.io/robots.txt`), nie in einem Projektordner wie `/pixelvault/`. Deshalb gibt es bewusst keine.

Grenze: Die Bild-Adressen auf raw.githubusercontent.com liegen außerhalb dieser Seite und tragen kein `noindex`. Wer eine Adresse kennt, kann das Bild abrufen.

## Rechtliches

`impressum.html` und `datenschutz.html`, beide `noindex, follow`. Die Seite setzt keine Cookies und lädt keine externen Schriften; die Datenschutzerklärung beschreibt genau das. Wird etwas eingebunden (Messung, Search-Console-Tag, Schrift), muss die Erklärung im selben Commit angepasst werden.

## Tech

Reines statisches HTML/CSS/JS, kein Build-Schritt, keine Abhängigkeiten. Die Startseite fragt die GitHub Contents API für `images/` ab und rendert die Galerie client-seitig.
