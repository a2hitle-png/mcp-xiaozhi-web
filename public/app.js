const categoryEl = document.getElementById("category");
const limitEl = document.getElementById("limit");
const loadNewsBtn = document.getElementById("loadNews");
const newsListEl = document.getElementById("newsList");

const wsStatusEl = document.getElementById("wsStatus");

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

// Google CSE search function
function executeGoogleSearch(query) {
  if (typeof google !== "undefined" && google.search && google.search.cse && google.search.cse.element) {
    const element = google.search.cse.element.getElement("gcs1");
    if (element) {
      element.execute(query);
    } else {
      console.error("Google CSE element 'gcs1' not found");
    }
  } else {
    console.error("Google CSE not loaded");
  }
}

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
  // Handle search_google command
  if (data.type === "search_google" && data.q) {
    executeGoogleSearch(data.q);
  }
}

// Initialize WebSocket
connectWebSocket();
