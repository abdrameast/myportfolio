import { cp, lstat, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.resolve(root, "dist");
// Never delete an arbitrary path or follow a checkout-local junction/symlink.
if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== "dist") {
  throw new Error("Unsafe build output path");
}
const previous = await lstat(output).catch((error) => {
  if (error.code !== "ENOENT") throw error;
});
if (previous?.isSymbolicLink()) throw new Error("dist must not be a symlink");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

// Only these files/directories are public. Repository tooling is never copied.
const publicPaths = [
  "index.html", "portfolio-details.html", "portfolio-details-erp.html",
  "portfolio-details-borne.html", "portfolio-details-systrack.html",
  "assets/css/portfolio.css", "assets/css/portfolio-details.css", "assets/css/minitrack.css",
  "assets/js/portfolio.js", "assets/js/hero3d.js", "assets/js/portfolio-details.js",
  "assets/js/minitrack.js", "assets/js/csv.js",
  "assets/vendor/bootstrap-icons/bootstrap-icons.min.css",
  "assets/vendor/bootstrap-icons/fonts/bootstrap-icons.woff2",
  "assets/vendor/bootstrap-icons/fonts/bootstrap-icons.woff",
  "assets/vendor/gsap-3.12.5", "assets/vendor/lenis-1.0.42", "assets/vendor/three-0.160.0"
];
// Permit image assets only, including nested portfolio screenshots.
async function images(directory) {
  for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.isSymbolicLink()) continue;
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) await images(relative);
    else if (/\.(png|jpe?g|webp|gif|svg|ico)$/i.test(entry.name)) publicPaths.push(relative);
  }
}
await images("assets/img");
for (const relative of publicPaths) {
  const source = path.join(root, relative);
  await mkdir(path.dirname(path.join(output, relative)), { recursive: true });
  await cp(source, path.join(output, relative), {
    recursive: true,
    filter: async (candidate) => {
      const entry = await lstat(candidate);
      return !entry.isSymbolicLink() && !path.basename(candidate).startsWith(".")
        && !/\.(bak|map)$/i.test(candidate);
    }
  });
}
console.log(`Built ${publicPaths.length} public entries in dist/`);
