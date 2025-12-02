const categoryEl = document.getElementById("category");
const limitEl = document.getElementById("limit");
const loadNewsBtn = document.getElementById("loadNews");
const newsListEl = document.getElementById("newsList");

const wsStatusEl = document.getElementById("wsStatus");
const searchResultsEl = document.getElementById("searchResults");
const articleContentEl = document.getElementById("articleContent");

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
  // Handle search results from WebSocket
  if (data.type === "search_results") {
    renderSearchResults(data.q, data.results || []);
  }
  // Handle article text (full)
  else if (data.type === "article_text") {
    renderArticleContent(data.title, data.contentText);
  }
  // Handle article chunk (partial)
  else if (data.type === "article_chunk") {
    appendArticleChunk(data.title, data.chunk, data.chunkIndex, data.totalChunks);
  }
  // Handle errors
  else if (data.type === "error") {
    renderError(data.op, data.message);
  }
}

function renderSearchResults(query, results) {
  if (!results.length) {
    searchResultsEl.innerHTML = `<p>Không tìm thấy kết quả cho: "${sanitize(query)}"</p>`;
    return;
  }
  
  let html = `<p>Kết quả tìm kiếm: "${sanitize(query)}"</p>`;
  results.forEach((item, index) => {
    html += `
      <div class="result-item">
        <div class="result-title">${index + 1}. ${sanitize(item.title)}</div>
        <div class="result-snippet">${sanitize(item.snippet)}</div>
        <div class="result-link"><a href="${item.link}" target="_blank" rel="noopener">${sanitize(item.displayLink)}</a></div>
      </div>
    `;
  });
  searchResultsEl.innerHTML = html;
}

function renderArticleContent(title, contentText) {
  articleContentEl.innerHTML = `
    <h4>${sanitize(title)}</h4>
    <p>${sanitize(contentText)}</p>
  `;
}

function appendArticleChunk(title, chunk, chunkIndex, totalChunks) {
  if (chunkIndex === 0) {
    articleContentEl.innerHTML = `<h4>${sanitize(title)}</h4><p></p>`;
  }
  const p = articleContentEl.querySelector("p");
  if (p) {
    p.textContent += chunk;
  }
}

function renderError(op, message) {
  const errorHtml = `<p style="color: #ef4444;">Lỗi (${sanitize(op)}): ${sanitize(message)}</p>`;
  if (op === "search_google") {
    searchResultsEl.innerHTML = errorHtml;
  } else {
    articleContentEl.innerHTML = errorHtml;
  }
}

// Initialize WebSocket
connectWebSocket();
