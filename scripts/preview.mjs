import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]));
const types = {
  ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".woff2": "font/woff2", ".woff": "font/woff", ".ico": "image/x-icon"
};

export function createPreviewServer() {
  return createServer(async (request, response) => {
    for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const candidate = path.resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
      const resolved = await realpath(candidate);
      const relative = path.relative(await realpath(root), resolved);
      if (relative.startsWith("..") || path.isAbsolute(relative) || !(await stat(resolved)).isFile()) {
        throw new Error("Not a public file");
      }
      const body = await readFile(resolved);
      response.writeHead(200, {
        "Content-Type": types[path.extname(resolved)] || "text/plain; charset=utf-8",
        "Content-Length": body.length
      });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(request.method === "HEAD" ? undefined : "Not found");
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createPreviewServer();
  server.listen(Number(process.env.PORT || 8124), "127.0.0.1", () => {
    console.log(`Preview with Vercel security headers: http://127.0.0.1:${server.address().port}`);
  });
}
