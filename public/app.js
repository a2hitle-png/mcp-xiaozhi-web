const categoryEl = document.getElementById("category");
const limitEl = document.getElementById("limit");
const loadNewsBtn = document.getElementById("loadNews");
const newsListEl = document.getElementById("newsList");

const wsStatusEl = document.getElementById("wsStatus");
const unlockAutoplayBtn = document.getElementById("unlockAutoplay");
const scEmbedContainerEl = document.getElementById("scEmbedContainer");

let scWidget = null;
let autoplayUnlocked = false;
let ws = null;

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

// SoundCloud URL validation
function isValidSoundCloudUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "soundcloud.com" || 
           parsed.hostname === "www.soundcloud.com" ||
           parsed.hostname.endsWith(".soundcloud.com");
  } catch {
    return false;
  }
}

// SoundCloud player functions
function createSoundCloudIframe(trackUrl) {
  const iframe = document.createElement("iframe");
  iframe.id = "scPlayer";
  iframe.width = "100%";
  iframe.height = "166";
  iframe.setAttribute("allow", "autoplay");
  iframe.style.border = "none";
  iframe.style.borderRadius = "8px";
  const encodedUrl = encodeURIComponent(trackUrl);
  iframe.src = `https://w.soundcloud.com/player/?url=${encodedUrl}&auto_play=true&show_artwork=true`;
  return iframe;
}

function loadSoundCloudTrack(trackUrl) {
  // Validate SoundCloud URL
  if (!isValidSoundCloudUrl(trackUrl)) {
    console.error("Invalid SoundCloud URL:", trackUrl);
    return;
  }
  
  scEmbedContainerEl.innerHTML = "";
  const iframe = createSoundCloudIframe(trackUrl);
  scEmbedContainerEl.appendChild(iframe);

  // Initialize SoundCloud Widget API
  if (typeof SC !== "undefined" && SC.Widget) {
    scWidget = SC.Widget(iframe);
    scWidget.bind(SC.Widget.Events.READY, () => {
      if (autoplayUnlocked) {
        scWidget.play();
      }
    });
    scWidget.bind(SC.Widget.Events.ERROR, (e) => {
      console.error("SoundCloud error:", e);
    });
  }
}

// Unlock autoplay button
unlockAutoplayBtn.addEventListener("click", () => {
  autoplayUnlocked = true;
  unlockAutoplayBtn.disabled = true;
  unlockAutoplayBtn.textContent = "Autoplay đã mở khoá";
  unlockAutoplayBtn.style.opacity = "0.6";
  
  // If there's already a widget, try to play
  if (scWidget) {
    scWidget.play();
  }
});

// WebSocket connection
function connectWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    wsStatusEl.textContent = "WebSocket: Đã kết nối ✓";
    wsStatusEl.classList.remove("disconnected");
    wsStatusEl.classList.add("connected");
  };

  ws.onclose = () => {
    wsStatusEl.textContent = "WebSocket: Đã ngắt kết nối";
    wsStatusEl.classList.remove("connected");
    wsStatusEl.classList.add("disconnected");
    // Reconnect after 3 seconds
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
    wsStatusEl.textContent = "WebSocket: Lỗi kết nối";
    wsStatusEl.classList.remove("connected");
    wsStatusEl.classList.add("disconnected");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    } catch (e) {
      console.error("Invalid WebSocket message:", e);
    }
  };
}

function handleWebSocketMessage(data) {
  // Handle play command with SoundCloud URL
  if (data.action === "play" && data.url) {
    loadSoundCloudTrack(data.url);
  }
  // Handle pause command
  else if (data.action === "pause" && scWidget) {
    scWidget.pause();
  }
  // Handle resume command
  else if (data.action === "resume" && scWidget) {
    scWidget.play();
  }
  // Handle stop command
  else if (data.action === "stop" && scWidget) {
    scWidget.pause();
    scWidget.seekTo(0);
  }
}

// Check for sc= query parameter
function checkQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const scUrl = params.get("sc");
  if (scUrl) {
    loadSoundCloudTrack(scUrl);
  }
}

// Initialize WebSocket and check query params
connectWebSocket();
checkQueryParams();
