// api/alerts.js - Vercel Serverless Function
// Place this file in the /api folder at the root of your project

export default async function handler(req, res) {
  // Allow CORS for your frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const RSS_URL =
    "https://www.google.fr/alerts/feeds/00897495945337774141/2039647074778688701";

  try {
    const response = await fetch(RSS_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RSS Reader; +https://your-site.vercel.app)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const xml = await response.text();

    // Parse XML manuellement (sans librairie externe)
    const items = [];
    const itemRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const entry = match[1];

      const title = (entry.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1]
        ?.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")
        ?.trim();

      const link =
        (entry.match(/<link[^>]*href="([^"]*)"/) || [])[1] ||
        (entry.match(/<link[^>]*>([\s\S]*?)<\/link>/) || [])[1]?.trim();

      const pubDate = (
        entry.match(/<published>([\s\S]*?)<\/published>/) || []
      )[1]?.trim();

      const description = (
        entry.match(/<content[^>]*>([\s\S]*?)<\/content>/) ||
        entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) || []
      )[1]
        ?.replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
        ?.trim();

      if (title && link) {
        items.push({ title, link, pubDate, description: description || "" });
      }
    }

    res.status(200).json({ status: "ok", items });
  } catch (error) {
    console.error("Erreur flux RSS:", error);
    res.status(500).json({ status: "error", message: error.message, items: [] });
  }
}
