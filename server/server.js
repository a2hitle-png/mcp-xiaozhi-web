import { createServer } from "http";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import WebSocket, { WebSocketServer } from "ws";
import { PORT, THANHNIEN_RSS } from "./config.js";
import { fetchFeed } from "./rss.js";
import { searchGoogle, isGoogleSearchConfigured } from "./googleSearch.js";
import { extractArticle, splitIntoChunks } from "./extract.js";

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.static("public"));

// Create HTTP server to share between Express and WebSocket
const server = createServer(app);

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true, service: "mcp-xiaozhi-web" }));

// List available categories
app.get("/api/news/categories", (req, res) => {
  res.json({ categories: Object.keys(THANHNIEN_RSS) });
});

// Fetch news by category
app.get("/api/news", async (req, res) => {
  try {
    const { category = "thoisu", limit = "20" } = req.query;
    const url = THANHNIEN_RSS[category];
    if (!url) return res.status(400).json({ error: "Invalid category" });
    const feed = await fetchFeed(url);
    // Giới hạn số lượng tin
    const n = Math.min(parseInt(limit, 10) || 20, 50);
    feed.items = feed.items.slice(0, n);
    res.json(feed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch RSS" });
  }
});

// MCP-friendly endpoints (tuỳ chọn)
app.get("/mcp/news/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const url = THANHNIEN_RSS[category];
    if (!url) return res.status(400).json({ error: "Invalid category" });
    const feed = await fetchFeed(url);
    res.json(feed);
  } catch (e) {
    res.status(500).json({ error: "MCP news failed" });
  }
});

// Google Search API endpoint
app.get("/api/search/google", async (req, res) => {
  try {
    if (!isGoogleSearchConfigured()) {
      return res.status(503).json({ 
        error: "Google Search not configured. Please set GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX environment variables." 
      });
    }

    const { q, topK = "5" } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Missing query parameter 'q'" });
    }

    const results = await searchGoogle(q, parseInt(topK, 10));
    res.json({ q, results });
  } catch (err) {
    console.error("Google Search error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Legacy alias for ESP32 firmware (expects /api/google-search?query=...&limit=...)
app.get("/api/google-search", async (req, res) => {
  try {
    if (!isGoogleSearchConfigured()) {
      return res.status(503).json({
        error: "Google Search not configured. Please set GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX environment variables."
      });
    }

    const query = (req.query.query || req.query.q || "").trim();
    if (!query) {
      return res.status(400).json({ error: "Missing query parameter 'query'" });
    }

    const limitRaw = parseInt(req.query.limit || req.query.topK || "5", 10);
    const limit = Math.min(Math.max(limitRaw || 5, 1), 10);
    const results = await searchGoogle(query, limit);
    res.json({ items: results });
  } catch (err) {
    console.error("Google Search alias error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Article extraction API endpoint
app.get("/api/article/extract", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "Missing query parameter 'url'" });
    }

    const article = await extractArticle(url);
    res.json(article);
  } catch (err) {
    console.error("Article extraction error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// WebSocket server on /ws path
const wss = new WebSocketServer({ server, path: "/ws" });

// Keep track of all connected clients with their search results
const clients = new Map();

wss.on("connection", (ws) => {
  // Store client state
  clients.set(ws, { results: [] });
  console.log("WebSocket client connected");

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());
      await handleWebSocketMessage(ws, message);
    } catch (e) {
      console.error("Invalid message received:", e.message);
      sendError(ws, "parse", "Invalid JSON message");
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("WebSocket client disconnected");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err.message);
    clients.delete(ws);
  });
});

/**
 * Handle incoming WebSocket messages
 */
async function handleWebSocketMessage(ws, message) {
  const { type } = message;

  switch (type) {
    case "hello":
      // Simple hello/handshake
      ws.send(JSON.stringify({ type: "hello_ack", role: message.role || "unknown" }));
      break;

    case "search_google":
      await handleSearchGoogle(ws, message);
      break;

    case "read_result":
      await handleReadResult(ws, message);
      break;

    case "read_url":
      await handleReadUrl(ws, message);
      break;

    default:
      // Unknown message type - ignore silently or send error
      console.log("Unknown message type:", type);
      break;
  }
}

/**
 * Handle Google search request
 */
async function handleSearchGoogle(ws, message) {
  try {
    if (!isGoogleSearchConfigured()) {
      sendError(ws, "search_google", "Google Search not configured");
      return;
    }

    const { q, topK = 5 } = message;
    if (!q) {
      sendError(ws, "search_google", "Missing query parameter 'q'");
      return;
    }

    const results = await searchGoogle(q, topK);
    
    // Store results for this client
    const clientState = clients.get(ws);
    if (clientState) {
      clientState.results = results;
    }

    ws.send(JSON.stringify({ type: "search_results", q, results }));
  } catch (err) {
    console.error("Search error:", err.message);
    sendError(ws, "search_google", err.message);
  }
}

/**
 * Handle read result by index
 */
async function handleReadResult(ws, message) {
  try {
    const { index } = message;
    const clientState = clients.get(ws);
    
    if (!clientState || !clientState.results || clientState.results.length === 0) {
      sendError(ws, "read_result", "No search results available. Please search first.");
      return;
    }

    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0 || idx >= clientState.results.length) {
      sendError(ws, "read_result", `Invalid index. Must be between 0 and ${clientState.results.length - 1}`);
      return;
    }

    const result = clientState.results[idx];
    await sendArticleContent(ws, result.link);
  } catch (err) {
    console.error("Read result error:", err.message);
    sendError(ws, "read_result", err.message);
  }
}

/**
 * Handle read URL directly
 */
async function handleReadUrl(ws, message) {
  try {
    const { url } = message;
    if (!url) {
      sendError(ws, "read_url", "Missing 'url' parameter");
      return;
    }

    await sendArticleContent(ws, url);
  } catch (err) {
    console.error("Read URL error:", err.message);
    sendError(ws, "read_url", err.message);
  }
}

/**
 * Extract and send article content (as chunks if long)
 */
async function sendArticleContent(ws, url) {
  const article = await extractArticle(url);
  const chunks = splitIntoChunks(article.contentText, 1000);

  if (chunks.length === 1) {
    // Send as single message
    ws.send(JSON.stringify({
      type: "article_text",
      title: article.title,
      contentText: article.contentText,
      url
    }));
  } else {
    // Send as multiple chunks
    for (let i = 0; i < chunks.length; i++) {
      ws.send(JSON.stringify({
        type: "article_chunk",
        title: article.title,
        chunk: chunks[i],
        chunkIndex: i,
        totalChunks: chunks.length,
        url
      }));
    }
  }
}

/**
 * Send error message to client
 */
function sendError(ws, op, message) {
  ws.send(JSON.stringify({ type: "error", op, message }));
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  if (!isGoogleSearchConfigured()) {
    console.log("Warning: Google Search API not configured. Set GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX environment variables.");
  }
});
