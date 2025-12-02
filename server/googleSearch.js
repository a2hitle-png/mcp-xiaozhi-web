/**
 * Google Programmable Search (Custom Search) API module
 */

const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY;
const GOOGLE_CSE_CX = process.env.GOOGLE_CSE_CX;

/**
 * Search Google using Custom Search JSON API
 * @param {string} query - Search query
 * @param {number} topK - Number of results to return (max 10)
 * @returns {Promise<Array<{title: string, link: string, snippet: string, displayLink: string}>>}
 */
export async function searchGoogle(query, topK = 5) {
  if (!GOOGLE_CSE_API_KEY || !GOOGLE_CSE_CX) {
    throw new Error("Missing GOOGLE_CSE_API_KEY or GOOGLE_CSE_CX environment variables");
  }

  const num = Math.min(Math.max(1, topK), 10); // Clamp between 1 and 10
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", GOOGLE_CSE_API_KEY);
  url.searchParams.set("cx", GOOGLE_CSE_CX);
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(num));

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Google Search API error: ${response.status} ${errorData?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  // Map results to simplified format
  const results = (data.items || []).map(item => ({
    title: item.title || "",
    link: item.link || "",
    snippet: item.snippet || "",
    displayLink: item.displayLink || ""
  }));

  return results;
}

/**
 * Check if Google CSE environment variables are configured
 * @returns {boolean}
 */
export function isGoogleSearchConfigured() {
  return Boolean(GOOGLE_CSE_API_KEY && GOOGLE_CSE_CX);
}
