const categoryEl = document.getElementById("category");
const limitEl = document.getElementById("limit");
const loadNewsBtn = document.getElementById("loadNews");
const newsListEl = document.getElementById("newsList");

const songQueryEl = document.getElementById("songQuery");
const openZingSearchBtn = document.getElementById("openZingSearch");

const audioEl = document.getElementById("audio");
const mp3UrlEl = document.getElementById("mp3Url");
const playAudioBtn = document.getElementById("playAudio");
const pauseAudioBtn = document.getElementById("pauseAudio");
const stopAudioBtn = document.getElementById("stopAudio");

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
openZingSearchBtn.addEventListener("click", async () => {
  const q = songQueryEl.value.trim();
  if (!q) return alert("Nhập từ khoá bài hát");
  const res = await fetch(`/api/zing/search?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  if (data.url) window.open(data.url, "_blank", "noopener");
});

// Audio controls
playAudioBtn.addEventListener("click", async () => {
  const url = mp3UrlEl.value.trim();
  if (!url) return alert("Nhập URL mp3 hợp lệ");
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
