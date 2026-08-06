const CONFIG = {
  owner: "Freemoser",
  repo: "pixelvault",
  branch: "main",
  path: "images",
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

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

function openLightbox(name) {
  lightboxImg.src = rawUrl(name);
  lightboxImg.alt = name;
  lightbox.classList.remove("hidden");
  lightbox.classList.add("show");
}

function closeLightbox() {
  lightbox.classList.remove("show");
  lightbox.classList.add("hidden");
  lightboxImg.src = "";
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

async function copyUrl(name, button) {
  const url = rawUrl(name);
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const tmp = document.createElement("textarea");
    tmp.value = url;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand("copy");
    tmp.remove();
  }
  showToast("URL kopiert");
  button.textContent = "Kopiert";
  button.classList.add("copied");
  setTimeout(() => {
    button.textContent = "Kopieren";
    button.classList.remove("copied");
  }, 1400);
}

function render(files) {
  grid.innerHTML = "";
  empty.classList.toggle("hidden", files.length > 0);

  const frag = document.createDocumentFragment();
  for (const file of files) {
    const card = document.createElement("div");
    card.className = "card";

    const thumb = document.createElement("div");
    thumb.className = "card-thumb";
    const img = document.createElement("img");
    img.src = rawUrl(file.name);
    img.loading = "lazy";
    img.alt = file.name;
    thumb.appendChild(img);
    thumb.addEventListener("click", () => openLightbox(file.name));

    const body = document.createElement("div");
    body.className = "card-body";
    const nameEl = document.createElement("span");
    nameEl.className = "card-name";
    nameEl.textContent = file.name;
    nameEl.title = file.name;
    const copyBtn = document.createElement("button");
    copyBtn.className = "card-copy";
    copyBtn.type = "button";
    copyBtn.textContent = "Kopieren";
    copyBtn.addEventListener("click", () => copyUrl(file.name, copyBtn));

    body.appendChild(nameEl);
    body.appendChild(copyBtn);
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
