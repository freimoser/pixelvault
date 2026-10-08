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

3. Fertig. Die Bild-URL funktioniert, sobald der Push durch ist. Die Galerie zeigt das Bild sofort; das kleine Vorschaubild dazu entsteht beim Deploy, der rund eine halbe Minute dauert.

   **Ein Bild ersetzen** (gleicher Dateiname): raw.githubusercontent.com hält Dateien bis zu 5 Minuten im Zwischenspeicher. Bis dahin kann in Metabase noch die alte Version erscheinen.

## Bild-URL für Metabase & Co.

Jedes Bild ist direkt erreichbar unter:

```
https://raw.githubusercontent.com/freimoser/pixelvault/main/images/<dateiname>
```

Auf der Galerie-Seite hat jedes Bild zwei Knöpfe:

- **URL** kopiert die nackte Bild-Adresse.
- **MD** kopiert fertiges Markdown (`![name](url)`). Das in eine Metabase-Textkarte einfügen, und das Bild erscheint direkt.

Schneller per Tastatur: `/` springt in die Suche, **Enter** kopiert die URL des ersten Treffers, **Umschalt+Enter** dessen Markdown. Ein Klick aufs Bild öffnet die Großansicht, dort gibt es dieselben beiden Knöpfe.

Unter jedem Namen steht die Dateigröße. Ab 500 KB ist sie gelb markiert: Ein Bild in einer Dashboard-Karte wird bei jedem Aufruf komplett geladen, also vor dem Einbinden verkleinern.

## Hinweis zur Sichtbarkeit

Das Repo ist öffentlich, da GitHub Pages + direktes Hotlinking (raw.githubusercontent.com) für kostenlose Accounts nur bei öffentlichen Repos zuverlässig funktioniert.

Was die Seite aus Suchmaschinen heraushält, sind die `noindex`-Meta-Tags in den HTML-Dateien. Eine `robots.txt` hilft hier **nicht**: Crawler lesen sie nur an der Wurzel des Hosts (`freimoser.github.io/robots.txt`), nie in einem Projektordner wie `/pixelvault/`. Deshalb gibt es bewusst keine.

Grenze: Die Bild-Adressen auf raw.githubusercontent.com liegen außerhalb dieser Seite und tragen kein `noindex`. Wer eine Adresse kennt, kann das Bild abrufen.

## Rechtliches

`impressum.html` und `datenschutz.html`, beide `noindex, follow`. Die Seite setzt keine Cookies und lädt keine externen Schriften; die Datenschutzerklärung beschreibt genau das. Wird etwas eingebunden (Messung, Search-Console-Tag, Schrift), muss die Erklärung im selben Commit angepasst werden.

## Tech

Statisches HTML/CSS/JS ohne Abhängigkeiten im Browser. Die Startseite fragt die GitHub Contents API für `images/` ab und rendert die Galerie client-seitig.

Beim Deploy (`.github/workflows/deploy.yml`) laufen zwei Schritte:

1. `scripts/check.sh` bricht ab bei externer Google-Schrift, fehlendem `noindex`, fehlenden Rechtstexten oder Favicons, relativen Pfaden in `404.html`, einer `robots.txt` im Ordner oder dem alten GitHub-Namen.
2. `scripts/thumbs.py` erzeugt WebP-Vorschaubilder (max. 480 px breit) nach `thumbs/`. Sie landen nur im ausgelieferten Artefakt, nie im Repo. Die Originale bleiben unverändert, damit keine eingebettete URL bricht. Fehlt eine Vorschau, lädt die Galerie das Original.
