const categoryEl = document.getElementById("category");
const limitEl = document.getElementById("limit");
const loadNewsBtn = document.getElementById("loadNews");
const newsListEl = document.getElementById("newsList");

const trackSelectEl = document.getElementById("trackSelect");
const audioEl = document.getElementById("audio");
const mp3UrlEl = document.getElementById("mp3Url");
const playAudioBtn = document.getElementById("playAudio");
const pauseAudioBtn = document.getElementById("pauseAudio");
const stopAudioBtn = document.getElementById("stopAudio");

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

// Load playlist from tracks.json
async function loadPlaylist() {
  try {
    const res = await fetch("/tracks.json");
    const tracks = await res.json();
    trackSelectEl.innerHTML = '<option value="">-- Chọn bài hát --</option>';
    tracks.forEach(track => {
      const opt = document.createElement("option");
      opt.value = track.url;
      opt.textContent = `${track.title} - ${track.artist}`;
      opt.dataset.license = track.license || "";
      trackSelectEl.appendChild(opt);
    });
  } catch (e) {
    console.error("Failed to load playlist:", e);
  }
}
loadPlaylist();

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
      opt.dataset.id = playlist.id;
      opt.dataset.kind = playlist.kind;
      zingPlaylistSelectEl.appendChild(opt);
    });
  } catch (e) {
    console.error("Failed to load Zing playlists:", e);
  }
}
loadZingPlaylists();

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

// Track select change - update URL input
trackSelectEl.addEventListener("change", () => {
  const url = trackSelectEl.value;
  if (url) {
    mp3UrlEl.value = url;
  }
});

// Audio controls
playAudioBtn.addEventListener("click", async () => {
  const url = mp3UrlEl.value.trim();
  if (!url) return alert("Nhập URL mp3 hợp lệ hoặc chọn bài hát từ playlist");
  if (audioEl.src !== url) audioEl.src = url;
  try {
    await audioEl.play();
  } catch (e) {
    alert("Trình duyệt chặn autoplay hoặc URL không hợp lệ.");
  }
});
pauseAudioBtn.addEventListener("click", () => audioEl.pause());
stopAudioBtn.addEventListener("click", () => {
  audioEl.pause();
  audioEl.currentTime = 0;
});

// Zing playlist embed
zingPlaylistSelectEl.addEventListener("change", () => {
  const src = zingPlaylistSelectEl.value;
  if (!src) {
    zingContainerEl.innerHTML = "";
    return;
  }
  
  zingContainerEl.innerHTML = `
    <iframe 
      width="100%" 
      height="400" 
      scrolling="no" 
      frameborder="no" 
      allow="autoplay" 
      src="${src}">
    </iframe>
  `;
});
