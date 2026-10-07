const CONFIG = {
  owner: "freimoser",
  repo: "pixelvault",
  branch: "main",
  path: "images",
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

// Ab hier gilt ein Bild als schwer für eine Dashboard-Karte.
const HEAVY_BYTES = 500 * 1000;

// Dezimal (1 MB = 1.000.000 Byte) wie im macOS-Finder — sonst zeigt die
// Galerie für dieselbe Datei eine andere Zahl als der Rechner, von dem sie kommt.
function formatBytes(bytes) {
  if (bytes >= 1e6) {
    return `${(bytes / 1e6).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1e3)).toLocaleString("de-DE")} KB`;
}

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const stats = document.getElementById("stats");
const empty = document.getElementById("empty");
const errorEl = document.getElementById("error");
const toast = document.getElementById("toast");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");

let allFiles = [];

// Das Element, das die Großansicht geöffnet hat — dorthin kehrt der Fokus beim
// Schließen zurück, sonst landet eine Tastatur-Nutzerin wieder am Seitenanfang.
let lightboxOpener = null;

function openLightbox(name) {
  lightboxOpener = document.activeElement;
  lightboxImg.src = rawUrl(name);
  lightboxImg.alt = name;
  lightbox.classList.add("show");
  lightboxClose.focus();
}

function closeLightbox() {
  if (!lightbox.classList.contains("show")) return;
  lightbox.classList.remove("show");
  if (lightboxOpener && typeof lightboxOpener.focus === "function") {
    lightboxOpener.focus();
  }
  lightboxOpener = null;
}

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

function rawUrl(name) {
  return `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/${CONFIG.path}/${encodeURIComponent(name)}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 1600);
}

async function copyText(text, button, toastMessage) {
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
  showToast(toastMessage);
  const label = button.textContent;
  button.textContent = "Kopiert";
  button.classList.add("copied");
  setTimeout(() => {
    button.textContent = label;
    button.classList.remove("copied");
  }, 1400);
}

// Metabase-Textkarten rendern Markdown. Mit diesem Format ist das Bild nach
// dem Einfügen sofort sichtbar, statt dass man die URL von Hand einrahmt.
function markdownFor(name) {
  const alt = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  return `![${alt}](${rawUrl(name)})`;
}

function render(files) {
  grid.innerHTML = "";
  empty.classList.toggle("hidden", files.length > 0);

  const frag = document.createDocumentFragment();
  for (const file of files) {
    const card = document.createElement("div");
    card.className = "card";

    // Ein Button statt eines div: nur so ist die Großansicht per Tab und
    // Enter erreichbar und wird von Screenreadern als Bedienelement angesagt.
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = "card-thumb";
    thumb.setAttribute("aria-label", `Großansicht öffnen: ${file.name}`);
    const img = document.createElement("img");
    img.src = rawUrl(file.name);
    img.loading = "lazy";
    img.alt = file.name;
    thumb.appendChild(img);
    thumb.addEventListener("click", () => openLightbox(file.name));

    const body = document.createElement("div");
    body.className = "card-body";
    const meta = document.createElement("div");
    meta.className = "card-meta";
    const nameEl = document.createElement("span");
    nameEl.className = "card-name";
    nameEl.textContent = file.name;
    nameEl.title = file.name;
    meta.appendChild(nameEl);

    // Ein Bild in einer Dashboard-Karte wird bei jedem Aufruf komplett
    // geladen. Die Größe liefert die API ohnehin mit; ab HEAVY_BYTES wird
    // sie markiert, damit ein zu großes Bild auffällt, bevor es eingebunden ist.
    const sizeEl = document.createElement("span");
    sizeEl.className = "card-size";
    sizeEl.textContent = formatBytes(file.size);
    if (file.size >= HEAVY_BYTES) {
      sizeEl.classList.add("heavy");
      sizeEl.title = "Groß für ein Dashboard — vor dem Einbinden verkleinern";
    }
    meta.appendChild(sizeEl);
    const copyBtn = document.createElement("button");
    copyBtn.className = "card-copy";
    copyBtn.type = "button";
    copyBtn.textContent = "URL";
    copyBtn.title = "Bild-URL kopieren";
    copyBtn.setAttribute("aria-label", `Bild-URL kopieren: ${file.name}`);
    copyBtn.addEventListener("click", () =>
      copyText(rawUrl(file.name), copyBtn, "URL kopiert"),
    );

    const mdBtn = document.createElement("button");
    mdBtn.className = "card-copy";
    mdBtn.type = "button";
    mdBtn.textContent = "MD";
    mdBtn.title = "Als Markdown kopieren – für Metabase-Textkarten";
    mdBtn.setAttribute("aria-label", `Als Markdown kopieren: ${file.name}`);
    mdBtn.addEventListener("click", () =>
      copyText(markdownFor(file.name), mdBtn, "Markdown kopiert"),
    );

    body.appendChild(meta);
    body.appendChild(copyBtn);
    body.appendChild(mdBtn);
    card.appendChild(thumb);
    card.appendChild(body);
    frag.appendChild(card);
  }
  grid.appendChild(frag);
}

function applyFilter() {
  const q = search.value.trim().toLowerCase();
  const filtered = q ? allFiles.filter((f) => f.name.toLowerCase().includes(q)) : allFiles;
  render(filtered);
  stats.textContent = `${filtered.length} von ${allFiles.length} Bild${allFiles.length === 1 ? "" : "ern"}`;
}

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
      throw new Error(`GitHub API antwortete mit ${res.status}`);
    }
    const data = await res.json();
    allFiles = (Array.isArray(data) ? data : [])
      .filter((f) => f.type === "file" && IMAGE_EXT.test(f.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    applyFilter();
  } catch (err) {
    stats.textContent = "";
    errorEl.textContent = `Konnte Bilder nicht laden: ${err.message}`;
    errorEl.classList.remove("hidden");
  }
}

search.addEventListener("input", applyFilter);
loadFiles();
