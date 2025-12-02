const categoryEl = document.getElementById("category");
const limitEl = document.getElementById("limit");
const loadNewsBtn = document.getElementById("loadNews");
const newsListEl = document.getElementById("newsList");

const songQueryEl = document.getElementById("songQuery");
const openZingSearchBtn = document.getElementById("openZingSearch");
const zingStatusEl = document.getElementById("zingStatus");

const audioEl = document.getElementById("audio");
const mp3UrlEl = document.getElementById("mp3Url");
const playAudioBtn = document.getElementById("playAudio");
const pauseAudioBtn = document.getElementById("pauseAudio");
const stopAudioBtn = document.getElementById("stopAudio");
const audioStatusEl = document.getElementById("audioStatus");

// Helper to set status message
function setStatus(el, message, type = "") {
  el.textContent = message;
  el.className = "status-message" + (type ? " " + type : "");
}

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

// Zing search handler
let zingTab = null;
async function openZingSearch() {
  const q = songQueryEl.value.trim();
  if (!q) {
    setStatus(zingStatusEl, "Vui lòng nhập từ khoá bài hát", "error");
    return;
  }
  
  // Open blank tab immediately to avoid popup blocker
  zingTab = window.open("about:blank", "_blank", "noopener");
  
  openZingSearchBtn.disabled = true;
  setStatus(zingStatusEl, "Đang tìm kiếm...");
  
  try {
    const res = await fetch(`/api/zing/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (data.url && zingTab) {
      zingTab.location = data.url;
      setStatus(zingStatusEl, "Đã mở Zing MP3", "success");
    } else if (data.error) {
      setStatus(zingStatusEl, data.error, "error");
      if (zingTab) zingTab.close();
    }
  } catch (e) {
    setStatus(zingStatusEl, "Lỗi kết nối", "error");
    if (zingTab) zingTab.close();
  } finally {
    openZingSearchBtn.disabled = false;
  }
}

// Audio check and play handler
async function checkAndPlayAudio() {
  const url = mp3UrlEl.value.trim();
  if (!url) {
    setStatus(audioStatusEl, "Vui lòng nhập URL MP3", "error");
    return;
  }
  
  playAudioBtn.disabled = true;
  setStatus(audioStatusEl, "Đang kiểm tra URL...");
  
  try {
    const res = await fetch(`/api/audio/check?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    
    if (!data.ok) {
      const errorMsg = data.error || (!data.isAudio ? "URL không phải audio" : "URL không hợp lệ");
      setStatus(audioStatusEl, errorMsg, "error");
      playAudioBtn.disabled = false;
      return;
    }
    
    setStatus(audioStatusEl, "Đang tải audio...");
    if (audioEl.src !== url) audioEl.src = url;
    
    try {
      await audioEl.play();
    } catch (e) {
      setStatus(audioStatusEl, "Trình duyệt chặn autoplay hoặc URL không hợp lệ", "error");
    }
  } catch (e) {
    setStatus(audioStatusEl, "Lỗi kiểm tra URL", "error");
  } finally {
    playAudioBtn.disabled = false;
  }
}

// Audio player event listeners for status updates
audioEl.addEventListener("loadedmetadata", () => {
  setStatus(audioStatusEl, "Đã tải metadata", "success");
});

audioEl.addEventListener("waiting", () => {
  setStatus(audioStatusEl, "Đang đệm...");
});

audioEl.addEventListener("playing", () => {
  setStatus(audioStatusEl, "Đang phát", "success");
});

audioEl.addEventListener("stalled", () => {
  setStatus(audioStatusEl, "Tạm dừng tải (stalled)");
});

audioEl.addEventListener("error", () => {
  setStatus(audioStatusEl, "Lỗi phát audio", "error");
});

audioEl.addEventListener("ended", () => {
  setStatus(audioStatusEl, "Đã kết thúc");
});

audioEl.addEventListener("pause", () => {
  if (!audioEl.ended) {
    setStatus(audioStatusEl, "Đã tạm dừng");
  }
});

// Events
loadNewsBtn.addEventListener("click", loadNews);
openZingSearchBtn.addEventListener("click", openZingSearch);

// Enter key handlers
songQueryEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    openZingSearch();
  }
});

mp3UrlEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    checkAndPlayAudio();
  }
});

// Audio controls
playAudioBtn.addEventListener("click", checkAndPlayAudio);
pauseAudioBtn.addEventListener("click", () => audioEl.pause());
stopAudioBtn.addEventListener("click", () => {
  audioEl.pause();
  audioEl.currentTime = 0;
  setStatus(audioStatusEl, "Đã dừng");
});
