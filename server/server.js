import express from "express";
import cors from "cors";
import morgan from "morgan";
import { PORT, THANHNIEN_RSS } from "./config.js";
import { fetchFeed } from "./rss.js";

const app = express();
app.use(cors());
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
