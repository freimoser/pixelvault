#!/usr/bin/env bash
# Livegang-Prüfung für pixelvault. Läuft vor jedem Deploy (siehe
# .github/workflows/deploy.yml) und bricht ab, statt einen der Fehler
# auszuliefern, die hier schon einmal live waren.
set -u
fail=0
err() { echo "BLOCKER: $*"; fail=1; }

# Google Fonts vom Google-Server übertragen die IP ohne Einwilligung.
grep -lE "fonts\.(googleapis|gstatic)\.com" *.html >/dev/null 2>&1 \
  && err "externe Google-Schrift eingebunden: $(grep -lE 'fonts\.(googleapis|gstatic)\.com' *.html | tr '\n' ' ')"

# Jede Seite muss aus dem Index bleiben — das ist der einzige wirksame Schutz,
# weil eine robots.txt im Projektordner nicht gelesen wird.
for f in *.html; do
  grep -qE '<meta name="robots" content="[^"]*noindex' "$f" || err "$f ohne noindex"
done

# Rechtstexte vorhanden und verlinkt.
for f in impressum.html datenschutz.html; do
  [ -f "$f" ] || err "$f fehlt"
  grep -q "href=\"$f\"" index.html || err "index.html verlinkt $f nicht"
done

# Favicon: Dateien da und eingebunden (sonst Standard-Globus im Tab).
for f in favicon.svg favicon.ico favicon-32.png favicon-96.png apple-touch-icon.png 404.html; do
  [ -f "$f" ] || err "$f fehlt"
done
grep -q 'rel="icon" href="data:,"' index.html && err "Favicon ist per data:, abgeschaltet"

# Die 404-Seite wird unter beliebigen Pfaden ausgeliefert — relative Verweise
# zeigen dort ins Leere.
grep -qE '(href|src)="(style\.css|favicon|impressum|datenschutz|\./)' 404.html 2>/dev/null \
  && err "404.html enthält relative Pfade — nur /pixelvault/... verwenden"

# Lokale CSS/JS-Verweise brauchen ?v=dev — der Deploy ersetzt das durch die
# Commit-Kennung. Ohne sie mischt der 10-Minuten-Cache von GitHub Pages nach
# einem Deploy neues HTML mit altem CSS.
# Kein "| while": hinter einer Pipe liefe die Schleife in einer Subshell, und
# err() könnte $fail nicht setzen — der Blocker würde gemeldet, aber ignoriert.
for f in *.html; do
  bad=$(grep -oE '(href|src)="[^"]*\.(css|js)(\?[^"]*)?"' "$f" | grep -v '="https\?://' | grep -v '?v=dev"')
  [ -n "$bad" ] && while read -r ref; do err "$f: $ref ohne ?v=dev"; done <<< "$bad"
done

# Eine robots.txt im Projektordner täuscht Schutz nur vor.
[ -f robots.txt ] && err "robots.txt im Projektordner ist wirkungslos — entfernen"

# Nach der Umbenennung von GitHub-Konto: alte Pages-Adresse ist tot.
grep -rlIi "freemoser" --include="*.html" --include="*.js" --include="*.md" . >/dev/null 2>&1 \
  && err "alter GitHub-Name 'Freemoser' referenziert"

[ "$fail" -eq 0 ] && echo "Livegang-Prüfung: alles in Ordnung."
exit "$fail"
