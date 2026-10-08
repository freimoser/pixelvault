const CONFIG = {
  owner: "freimoser",
  repo: "pixelvault",
  branch: "main",
  path: "images",
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

// Ab hier gilt ein Bild als schwer für eine Dashboard-Karte.
const HEAVY_BYTES = 500 * 1000;

// So viele Kacheln laden sofort statt verzögert: Die erste sichtbare Reihe war
// das größte Element der Seite, und verzögertes Laden hat genau sie gebremst.
const EAGER_COUNT = 4;

const $ = (id) => document.getElementById(id);
const grid = $("grid");
const search = $("search");
const stats = $("stats");
const empty = $("empty");
const errorEl = $("error");
const toast = $("toast");
const lightbox = $("lightbox");
const lightboxImg = $("lightbox-img");
const lightboxClose = $("lightbox-close");
const lbName = $("lb-name");
const lbSize = $("lb-size");
const lbUrl = $("lb-url");
const lbMd = $("lb-md");

let allFiles = [];
let visibleFiles = [];
let currentFile = null;

// --- Adressen -------------------------------------------------------------

function rawUrl(name) {
  return `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/${CONFIG.path}/${encodeURIComponent(name)}`;
}

// Kleine WebP-Vorschau, beim Deploy von scripts/thumbs.py erzeugt. Fehlt sie
// (lokal, SVG, ganz neues Bild vor dem nächsten Deploy), springt das
// onerror in render() aufs Original.
function thumbUrl(name) {
  return /\.svg$/i.test(name) ? rawUrl(name) : `thumbs/${encodeURIComponent(name)}.webp`;
}

// Lesbarer Name statt Dateiname: Ein Screenreader liest sonst
// "petleo minus project minus failed punkt png" vor.
function altFor(name) {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

// Metabase-Textkarten rendern Markdown. Mit diesem Format ist das Bild nach
// dem Einfügen sofort sichtbar, statt dass man die URL von Hand einrahmt.
function markdownFor(name) {
  return `![${altFor(name)}](${rawUrl(name)})`;
}

// Dezimal (1 MB = 1.000.000 Byte) wie im macOS-Finder — sonst zeigt die
// Galerie für dieselbe Datei eine andere Zahl als der Rechner, von dem sie kommt.
function formatBytes(bytes) {
  if (bytes >= 1e6) {
    return `${(bytes / 1e6).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1e3)).toLocaleString("de-DE")} KB`;
}

// --- Kopieren -------------------------------------------------------------

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 1800);
}

async function copyText(text, toastMessage, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const tmp = document.createElement("textarea");
    tmp.value = text;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand("copy");
    tmp.remove();
  }
  // Der Dateiname gehört in die Meldung: Beim Kopieren per Enter sieht man
  // sonst nicht, welches Bild es war.
  showToast(toastMessage);
  if (!button) return;
  const label = button.textContent;
  button.textContent = "Kopiert";
  button.classList.add("copied");
  setTimeout(() => {
    button.textContent = label;
    button.classList.remove("copied");
  }, 1400);
}

const copyUrl = (file, button) => copyText(rawUrl(file.name), `URL von ${file.name} kopiert`, button);
const copyMd = (file, button) => copyText(markdownFor(file.name), `Markdown für ${file.name} kopiert`, button);

// --- Raster ---------------------------------------------------------------

function actButton(label, ariaLabel, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "act";
  b.textContent = label;
  // Der sichtbare Text muss im Namen für Screenreader vorkommen, sonst passt
  // ein Sprachbefehl wie "klicke MD" nicht — deshalb steht er vorn.
  b.setAttribute("aria-label", ariaLabel);
  b.title = ariaLabel;
  b.addEventListener("click", onClick);
  return b;
}

function render(files) {
  visibleFiles = files;
  grid.textContent = "";
  empty.hidden = files.length > 0;

  const frag = document.createDocumentFragment();
  files.forEach((file, i) => {
    const card = document.createElement("article");
    card.className = "card";

    // Ein Button statt eines div: nur so ist die Großansicht per Tab und
    // Enter erreichbar und wird von Screenreadern als Bedienelement angesagt.
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = "thumb";
    thumb.setAttribute("aria-label", `Großansicht: ${altFor(file.name)}`);
    thumb.addEventListener("click", () => openLightbox(file));

    const img = document.createElement("img");
    img.alt = altFor(file.name);
    // Feste Maße im Seitenverhältnis der Kachel (16:10): Der Browser reserviert
    // den Platz, bevor das Bild da ist. object-fit: contain hält echte Formate
    // darin unverzerrt.
    img.width = 480;
    img.height = 300;
    img.decoding = "async";
    if (i < EAGER_COUNT) {
      img.loading = "eager";
      if (i === 0) img.fetchPriority = "high";
    } else {
      img.loading = "lazy";
    }
    img.addEventListener("error", function fallback() {
      img.removeEventListener("error", fallback);
      img.src = rawUrl(file.name);
    });
    img.src = thumbUrl(file.name);
    thumb.appendChild(img);

    const foot = document.createElement("div");
    foot.className = "card-foot";

    const meta = document.createElement("div");
    meta.className = "meta";
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = file.name;
    name.title = file.name;
    const size = document.createElement("span");
    size.className = "size";
    size.textContent = formatBytes(file.size);
    if (file.size >= HEAVY_BYTES) {
      size.classList.add("heavy");
      size.textContent += " · groß";
      size.title = "Groß für ein Dashboard — vor dem Einbinden verkleinern";
    }
    meta.append(name, size);

    const urlBtn = actButton("URL", `URL kopieren: ${file.name}`, () => copyUrl(file, urlBtn));
    const mdBtn = actButton("MD", `MD kopieren, als Markdown: ${file.name}`, () => copyMd(file, mdBtn));

    foot.append(meta, urlBtn, mdBtn);
    card.append(thumb, foot);
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

function applyFilter() {
  const q = search.value.trim().toLowerCase();
  const filtered = q ? allFiles.filter((f) => f.name.toLowerCase().includes(q)) : allFiles;
  render(filtered);
  const total = allFiles.length;
  stats.textContent = q
    ? `${filtered.length} von ${total}`
    : `${total} Bild${total === 1 ? "" : "er"}`;
}

// --- Großansicht ----------------------------------------------------------

// Das Element, das die Großansicht geöffnet hat — dorthin kehrt der Fokus beim
// Schließen zurück, sonst landet eine Tastatur-Nutzerin wieder am Seitenanfang.
let lightboxOpener = null;

function openLightbox(file) {
  currentFile = file;
  lightboxOpener = document.activeElement;
  lightboxImg.src = rawUrl(file.name);
  lightboxImg.alt = altFor(file.name);
  lbName.textContent = file.name;
  lbSize.textContent = formatBytes(file.size);
  lbSize.classList.toggle("heavy", file.size >= HEAVY_BYTES);
  lightbox.classList.add("show");
  // Kopieren ist der wahrscheinlichste nächste Schritt.
  lbUrl.focus();
}

function closeLightbox() {
  if (!lightbox.classList.contains("show")) return;
  lightbox.classList.remove("show");
  currentFile = null;
  if (lightboxOpener && typeof lightboxOpener.focus === "function") lightboxOpener.focus();
  lightboxOpener = null;
}

lbUrl.addEventListener("click", () => currentFile && copyUrl(currentFile, lbUrl));
lbMd.addEventListener("click", () => currentFile && copyMd(currentFile, lbMd));
lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

// --- Tastatur -------------------------------------------------------------

document.addEventListener("keydown", (e) => {
  const open = lightbox.classList.contains("show");

  if (e.key === "Escape") {
    if (open) return closeLightbox();
    if (document.activeElement === search && search.value) {
      search.value = "";
      applyFilter();
    }
    return;
  }

  // Fokus bleibt im offenen Dialog (aria-modal verspricht genau das).
  if (open && e.key === "Tab") {
    const items = [lbUrl, lbMd, lightboxClose];
    const i = items.indexOf(document.activeElement);
    e.preventDefault();
    items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    return;
  }

  // "/" springt in die Suche — außer man tippt gerade irgendwo.
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "");
  if (e.key === "/" && !typing && !open && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    search.focus();
    search.select();
  }
});

// Enter in der Suche kopiert die URL des ersten Treffers, Umschalt+Enter das
// Markdown: tippen, Enter, einfügen — ohne die Maus.
search.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || visibleFiles.length === 0) return;
  e.preventDefault();
  const first = visibleFiles[0];
  if (e.shiftKey) copyMd(first);
  else copyUrl(first);
});

search.addEventListener("input", applyFilter);

// --- Laden ----------------------------------------------------------------

async function loadFiles() {
  const apiUrl = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}?ref=${CONFIG.branch}`;
  try {
    const res = await fetch(apiUrl, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) {
      if (res.status === 404) {
        allFiles = [];
        applyFilter();
        return;
      }
      // Ohne Anmeldung erlaubt GitHub 60 Abfragen pro Stunde und IP-Adresse.
      // Ist das aufgebraucht, kommt 403 oder 429 — und eine nackte Statuszahl
      // über einer leeren Galerie sieht aus wie ein Defekt, nicht wie Warten.
      const remaining = res.headers.get("x-ratelimit-remaining");
      const reset = Number(res.headers.get("x-ratelimit-reset"));
      if ((res.status === 403 || res.status === 429) && remaining === "0" && reset) {
        const at = new Date(reset * 1000).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        });
        throw new Error(
          `GitHub erlaubt ohne Anmeldung 60 Abfragen pro Stunde, und die sind aufgebraucht. Ab ${at} Uhr lädt die Galerie wieder. Die Bild-Adressen in Metabase funktionieren davon unabhängig weiter.`,
        );
      }
      throw new Error(`GitHub antwortete mit Status ${res.status}.`);
    }
    const data = await res.json();
    allFiles = (Array.isArray(data) ? data : [])
      .filter((f) => f.type === "file" && IMAGE_EXT.test(f.name))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
    applyFilter();
  } catch (err) {
    stats.textContent = "";
    // fetch wirft bei fehlender Verbindung einen TypeError mit englischem,
    // browserabhängigem Text ("Failed to fetch", "Load failed").
    const reason =
      err instanceof TypeError
        ? "Keine Verbindung zu GitHub — Internetverbindung prüfen und neu laden."
        : err.message;
    errorEl.textContent = `Bilder konnten nicht geladen werden. ${reason}`;
    errorEl.hidden = false;
  }
}

loadFiles();
