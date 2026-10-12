import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serializeCSV } from "../assets/js/csv.js";
import { createPreviewServer } from "../scripts/preview.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "dist");
await mkdir(dist, { recursive: true });
await writeFile(path.join(dist, "stale-backup.bak"), "Must not survive a rebuild");
execFileSync(process.execPath, [path.join(root, "scripts/build.mjs")]);

async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(filename));
    else result.push(filename);
  }
  return result;
}

test("CSV exports neutralize formula prefixes, whitespace and control-character variants", () => {
  for (const value of ["=1+1", "+SUM(1,2)", "-1+2", "@SUM(1,2)", " =1+1", "\t=1+1",
    "\r=1+1", "\n=1+1", "\u0000=1+1", "\ufeff=1+1", "＝1+1", "＋1", "－1", "＠SUM(1)"]) {
    assert.equal(serializeCSV([[value]]), '"\'' + value + '"', JSON.stringify(value));
  }
});

test("CSV preserves numbers, French text, quoting and field boundaries", () => {
  assert.equal(serializeCSV([["Écran; 27\"", -12, 0, null], ["ligne\nsuivante", "normal", 2.5, ""]]),
    '"Écran; 27""";"-12";"0";""\r\n"ligne\nsuivante";"normal";"2.5";""');
  assert.equal(serializeCSV([['=HYPERLINK("https://example.com";"test")']]),
    '"\'=HYPERLINK(""https://example.com"";""test"")"');
});

test("build excludes repository metadata, templates, backups and old APIs", async () => {
  const names = (await files(dist)).map((file) => path.relative(dist, file).replaceAll("\\", "/"));
  for (const name of names) {
    assert.ok(!name.split("/").some((segment) => segment.startsWith(".")), name);
    assert.ok(!/\.(bak|map|env)$/i.test(name), name);
    assert.ok(!/^(api|forms|scripts|tests)\//.test(name), name);
  }
  assert.deepEqual(names.filter((name) => name.endsWith(".html")).sort(), [
    "index.html", "portfolio-details-borne.html", "portfolio-details-erp.html",
    "portfolio-details-systrack.html", "portfolio-details.html"
  ]);
  await assert.rejects(access(path.join(dist, "stale-backup.bak")));
});

test("every HTML page uses local external scripts and its local links resolve", async () => {
  for (const file of (await files(dist)).filter((name) => name.endsWith(".html"))) {
    const html = await readFile(file, "utf8");
    for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      assert.match(attrs, /\bsrc="assets\//);
      assert.equal(body.trim(), "");
    }
    assert.doesNotMatch(html, /\son\w+\s*=|<iframe\b|http-equiv=["']refresh/i);
    for (const [, href] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      if (/^(https?:|mailto:|tel:)/.test(href)) continue;
      await access(path.resolve(path.dirname(file), href.split(/[?#]/)[0]));
    }
  }
  const home = await readFile(path.join(dist, "index.html"), "utf8");
  assert.doesNotMatch(home, /preloader|importmap/);
  assert.match(home, /id="contact-privacy"/);
  assert.match(home, /action="https:\/\/formspree\.io\/f\/xnjowgel" method="POST"/);
  assert.match(await readFile(path.join(dist, "portfolio-details-systrack.html"), "utf8"), /sans connexion/);
});

test("vendored scripts retain the verified upstream SHA-256 digests", async () => {
  const manifest = JSON.parse(await readFile(path.join(root, "assets/vendor/vendor-manifest.json"), "utf8"));
  for (const entry of manifest) {
    assert.equal(createHash("sha256").update(await readFile(path.join(dist, entry.path))).digest("hex"), entry.sha256);
  }
});

test("public responses enforce CSP and hidden paths are inaccessible", async (t) => {
  const server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(base);
  assert.equal(response.status, 200);
  const csp = response.headers.get("content-security-policy");
  assert.match(csp, /(?:^|; )script-src 'self';/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'none'/);
  assert.match(csp, /form-action https:\/\/formspree\.io;/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(response.headers.get("strict-transport-security"), /max-age=63072000/);
  for (const hidden of ["/.git/config", "/.kilo/package-lock.json", "/.claude/launch.json", "/.DS_Store",
    "/index.legacy.html.bak", "/starter-page.html", "/service-details.html", "/api/alerts", "/%2e%2e%5cpackage.json"]) {
    assert.equal((await fetch(base + hidden)).status, 404, hidden);
  }
});
