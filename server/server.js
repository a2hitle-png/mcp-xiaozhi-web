import express from "express";
import cors from "cors";
import morgan from "morgan";
import { PORT, THANHNIEN_RSS } from "./config.js";
import { fetchFeed } from "./rss.js";

const app = express();

// CORS configuration: read allowed origins from CORS_ORIGINS env var (comma-separated)
// Default to permissive (true) if env not set
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(o => o.trim()).filter(Boolean)
  : true;

app.use(cors({
  origin: corsOrigins,
  methods: ["GET", "HEAD", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(morgan("dev"));
app.use(express.static("public"));

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

// Zing MP3 search helper: tạo URL tìm kiếm chính thức
app.get("/api/zing/search", (req, res) => {
  const { q = "" } = req.query;
  const query = encodeURIComponent(q.trim());
  if (!query) return res.status(400).json({ error: "Missing query" });
  // Zing không có API công khai: trả về URL tìm kiếm để mở tab
  const url = `https://zingmp3.vn/tim-kiem/tat-ca?q=${query}`;
  res.json({ url });
});

// Audio URL check helper: perform HEAD request to validate audio resource
// SSRF guard: block private/local IPs
const isPrivateIP = (hostname) => {
  // Block localhost, private ranges, and link-local addresses
  const privatePatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^\[?::1\]?$/,
    /^\[?fe80:/i,
    /^\[?fc00:/i,
    /^\[?fd00:/i
  ];
  return privatePatterns.some(p => p.test(hostname));
};

app.get("/api/audio/check", async (req, res) => {
  const { url: audioUrl } = req.query;
  if (!audioUrl) {
    return res.status(400).json({ ok: false, error: "Missing url parameter" });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(audioUrl);
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid URL" });
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return res.status(400).json({ ok: false, error: "Only http/https URLs allowed" });
  }

  // SSRF guard: block private IPs
  if (isPrivateIP(parsedUrl.hostname)) {
    return res.status(400).json({ ok: false, error: "Private/local URLs not allowed" });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(audioUrl, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "mcp-xiaozhi-web/1.0"
      }
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || "";
    const contentLength = response.headers.get("content-length") || null;
    const acceptRanges = response.headers.get("accept-ranges") || null;

    const isAudio = contentType.toLowerCase().startsWith("audio/");

    res.json({
      ok: isAudio && response.ok,
      status: response.status,
      headers: {
        contentType,
        contentLength: contentLength ? parseInt(contentLength, 10) : null,
        acceptRanges
      },
      isAudio
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.name === "AbortError" ? "Request timeout" : "Failed to check URL"
    });
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

app.get("/mcp/zing/search", (req, res) => {
  const { q = "" } = req.query;
  if (!q.trim()) return res.status(400).json({ error: "Missing query" });
  const url = `https://zingmp3.vn/tim-kiem/tat-ca?q=${encodeURIComponent(q.trim())}`;
  res.json({ url });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
