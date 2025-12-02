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

const soundCloudUrlEl = document.getElementById("soundCloudUrl");
const embedSoundCloudBtn = document.getElementById("embedSoundCloud");
const soundCloudContainerEl = document.getElementById("soundCloudContainer");

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

// SoundCloud widget configuration
const SOUNDCLOUD_WIDGET_CONFIG = {
  color: "%23ff5500",
  auto_play: false,
  hide_related: false,
  show_comments: true,
  show_user: true,
  show_reposts: false,
  show_teaser: true,
  visual: true
};

// SoundCloud embedding
embedSoundCloudBtn.addEventListener("click", () => {
  const url = soundCloudUrlEl.value.trim();
  if (!url) return alert("Nhập URL SoundCloud hợp lệ (ví dụ: https://soundcloud.com/artist/track)");
  
  // Validate SoundCloud URL with proper URL parsing
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return alert("URL không hợp lệ. Vui lòng nhập URL đúng định dạng.");
  }
  
  // Ensure the hostname is exactly soundcloud.com or a subdomain
  if (parsedUrl.hostname !== "soundcloud.com" && !parsedUrl.hostname.endsWith(".soundcloud.com")) {
    return alert("URL phải là đường dẫn SoundCloud (ví dụ: https://soundcloud.com/artist/track)");
  }
  
  const encodedUrl = encodeURIComponent(url);
  const configParams = Object.entries(SOUNDCLOUD_WIDGET_CONFIG)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const widgetUrl = `https://w.soundcloud.com/player/?url=${encodedUrl}&${configParams}`;
  
  soundCloudContainerEl.innerHTML = `
    <iframe 
      width="100%" 
      height="166" 
      scrolling="no" 
      frameborder="no" 
      allow="autoplay" 
      src="${widgetUrl}">
    </iframe>
  `;
});
