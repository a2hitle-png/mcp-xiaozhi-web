/**
 * Article content extraction module using Readability
 */

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

/**
 * Extract main article content from a URL
 * @param {string} url - URL of the article to extract
 * @returns {Promise<{title: string, contentText: string}>}
 */
export async function extractArticle(url) {
  // Validate URL
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  // Only allow http/https protocols
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only http and https URLs are supported");
  }

  // Fetch the article HTML
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; mcp-xiaozhi-web/1.0; +https://github.com/a2hitle-png/mcp-xiaozhi-web)"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Parse with JSDOM
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;

  // Use Readability to extract article content
  const reader = new Readability(document);
  const article = reader.parse();

  if (!article) {
    throw new Error("Could not extract article content from this URL");
  }

  // Clean the text content (remove extra whitespace, newlines)
  const contentText = article.textContent
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: article.title || "",
    contentText
  };
}

/**
 * Split text into chunks for streaming/TTS
 * @param {string} text - Text to split
 * @param {number} chunkSize - Maximum characters per chunk
 * @returns {string[]} Array of text chunks
 */
export function splitIntoChunks(text, chunkSize = 1000) {
  if (!text || text.length <= chunkSize) {
    return [text];
  }

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastQuestion = text.lastIndexOf("?", end);
      const lastExclaim = text.lastIndexOf("!", end);
      const breakPoint = Math.max(lastPeriod, lastQuestion, lastExclaim);
      
      if (breakPoint > start) {
        end = breakPoint + 1;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end;
  }

  return chunks.filter(chunk => chunk.length > 0);
}
