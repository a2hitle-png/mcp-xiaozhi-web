const categoryEl = document.getElementById("category");
const limitEl = document.getElementById("limit");
const loadNewsBtn = document.getElementById("loadNews");
const newsListEl = document.getElementById("newsList");

const zingPlaylistSelectEl = document.getElementById("zingPlaylistSelect");
const zingContainerEl = document.getElementById("zingContainer");

// Load categories
async function loadCategories() {
  const res = await fetch("/api/news/categories");
  const data = await res.json();
  categoryEl.innerHTML = "";
  (data.categories || []).forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryEl.appendChild(opt);
  });
}
loadCategories();

// Load news
async function loadNews() {
  const category = categoryEl.value;
  const limit = limitEl.value;
  newsListEl.innerHTML = "<li>Đang tải...</li>";
  try {
    const res = await fetch(`/api/news?category=${encodeURIComponent(category)}&limit=${encodeURIComponent(limit)}`);
    const data = await res.json();
    renderNews(data.items || []);
  } catch (e) {
    newsListEl.innerHTML = "<li>Lỗi tải tin</li>";
  }
}

function renderNews(items) {
  newsListEl.innerHTML = "";
  if (!items.length) {
    newsListEl.innerHTML = "<li>Không có tin</li>";
    return;
  }
  items.forEach(item => {
    const li = document.createElement("li");
    li.className = "news-item";
    li.innerHTML = `
      <div class="news-title">${sanitize(item.title)}</div>
      <div class="news-meta">${sanitize(item.pubDate || "")}</div>
      <div class="news-snippet">${sanitize(item.contentSnippet || "")}</div>
      <div class="news-actions">
        <a href="${item.link}" target="_blank" rel="noopener">Mở bài trên Thanh Niên</a>
      </div>
    `;
    newsListEl.appendChild(li);
  });
}

function sanitize(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

// Events
loadNewsBtn.addEventListener("click", loadNews);

// Load Zing playlists from zing-playlists.json
async function loadZingPlaylists() {
  try {
    const res = await fetch("/zing-playlists.json");
    const playlists = await res.json();
    zingPlaylistSelectEl.innerHTML = '<option value="">-- Chọn playlist --</option>';
    playlists.forEach(playlist => {
      const opt = document.createElement("option");
      opt.value = playlist.src;
      opt.textContent = playlist.title;
      zingPlaylistSelectEl.appendChild(opt);
    });
  } catch (e) {
    console.error("Failed to load Zing playlists:", e);
  }
}
loadZingPlaylists();

// Zing playlist embedding
zingPlaylistSelectEl.addEventListener("change", () => {
  const src = zingPlaylistSelectEl.value;
  if (!src) {
    zingContainerEl.innerHTML = "";
    return;
  }
  
  // Validate that the src is a valid Zing MP3 embed URL
  let parsedUrl;
  try {
    parsedUrl = new URL(src);
  } catch {
    zingContainerEl.innerHTML = "";
    return;
  }
  
  if (parsedUrl.hostname !== "zingmp3.vn" || !parsedUrl.pathname.startsWith("/embed/album/")) {
    zingContainerEl.innerHTML = "";
    return;
  }
  
  const iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.width = "100%";
  iframe.height = "400";
  iframe.style.border = "none";
  iframe.allowFullscreen = true;
  iframe.allow = "autoplay; clipboard-write; encrypted-media; picture-in-picture";
  
  zingContainerEl.innerHTML = "";
  zingContainerEl.appendChild(iframe);
});
