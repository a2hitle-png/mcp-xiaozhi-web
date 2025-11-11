import RSSParser from "rss-parser";
const parser = new RSSParser({
  headers: {
    "User-Agent": "mcp-xiaozhi-web/1.0"
  }
});

export async function fetchFeed(url) {
  const feed = await parser.parseURL(url);
  // Chuẩn hoá dữ liệu
  const items = (feed.items || []).map(item => ({
    title: item.title || "",
    link: item.link || "",
    pubDate: item.pubDate || "",
    contentSnippet: item.contentSnippet || "",
    creator: item.creator || "",
    categories: item.categories || []
  }));
  return {
    title: feed.title || "Thanh Niên",
    items
  };
}
