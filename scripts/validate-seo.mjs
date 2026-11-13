import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { pages, home, redirects, SITE_URL } from "../src/data/seoPages.js";
import { keywordMap } from "../src/data/seoKeywords.js";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const all = [home, ...pages];
const failures = [];
const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();
const pagePaths = new Set(all.map(({ path }) => path));
const fromPaths = new Set();
const siteRoot = new URL(`${SITE_URL}/`);
const rendered = new Map();
const esc = (value) => value.replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" }[char]));
const pageFile = (path) => join(dist, path.slice(1), "index.html");
for (const page of all) {
  if (!page.h1) failures.push(`${page.path}: missing H1`);
  if (!page.title) failures.push(`${page.path}: missing title`);
  if (!page.metaDescription) failures.push(`${page.path}: missing meta description`);
  if (page.canonical !== `${SITE_URL}${page.path}`) failures.push(`${page.path}: invalid canonical`);
  if (!page.sections?.length) failures.push(`${page.path}: missing content sections`);
  if (!page.faq?.length) failures.push(`${page.path}: missing FAQ`);
  for (const [value, label, map] of [[page.title, "title", titles], [page.metaDescription, "description", descriptions], [page.canonical, "canonical", canonicals]]) {
    const previous = map.get(value);
    if (previous) failures.push(`${page.path}: duplicate ${label} with ${previous}`);
    map.set(value, page.path);
  }
  if (page.parent && (!pagePaths.has(page.parent) || page.parent === page.path)) failures.push(`${page.path}: invalid parent ${page.parent}`);
  for (const slug of page.related) {
    if (!pagePaths.has(`/${slug}/`)) failures.push(`${page.path}: related page is missing: ${slug}`);
  }
  const html = await readFile(pageFile(page.path), "utf8").catch(() => "");
  if (!html.includes(`<title>${esc(page.title)}</title>`) || !html.includes(`<link rel="canonical" href="${esc(page.canonical)}">`)) {
    failures.push(`${page.path}: built page is missing its title or canonical`);
  }
  const seoBody = page.path === "/" ? html.match(/<body>[\s\S]*?<!-- seo:start -->([\s\S]*?)<!-- seo:end -->/)?.[1] ?? "" : html;
  const links = new Set();
  for (const match of seoBody.matchAll(/<a\b[^>]* href="([^"#]+)"/g)) {
    const href = match[1];
    if (/^https?:\/\//.test(href)) continue;
    const destination = new URL(href, page.canonical);
    const path = `/${destination.pathname.slice(siteRoot.pathname.length)}`;
    if (!destination.href.startsWith(siteRoot.href) || !pagePaths.has(path)) failures.push(`${page.path}: broken internal link ${href}`);
    links.add(path);
  }
  rendered.set(page.path, links);
  if (page.path === "/") {
    if (!html.includes('<div id="root"></div>') || !/<script\b[^>]*type="module"[^>]*src=/.test(html) || !/<link\b[^>]*rel="stylesheet"[^>]*href="[^"\s]*assets\//.test(html)) {
      failures.push("Homepage lost the app mount, script, or Vite stylesheet.");
    }
  }
}
const terms = new Set();
for (const { keyword, url } of keywordMap) {
  const normalized = keyword.trim().toLowerCase().replace(/[\s-]+/g, " ");
  if (terms.has(normalized)) failures.push(`Duplicate keyword: ${keyword}`);
  if (!pagePaths.has(url)) failures.push(`Keyword targets an unavailable page: ${keyword} → ${url}`);
  terms.add(normalized);
}
for (const { from, to } of redirects) {
  if (fromPaths.has(from) || pagePaths.has(from) || !pagePaths.has(to)) failures.push(`Invalid redirect ${from} → ${to}`);
  fromPaths.add(from);
  const html = await readFile(pageFile(from), "utf8").catch(() => "");
  const location = html.match(/http-equiv="refresh" content="0;url=([^"]+)"/)?.[1];
  if (!location || new URL(location, `${SITE_URL}${from}`).href !== `${SITE_URL}${to}`) failures.push(`${from}: built redirect has the wrong destination`);
}
const sitemap = await readFile(join(dist, "sitemap.xml"), "utf8").catch(() => "");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapSet = new Set(sitemapUrls);
if (sitemapUrls.length !== all.length || sitemapSet.size !== all.length) failures.push("Sitemap URL count differs from the preferred pages.");
for (const page of all) if (!sitemapSet.has(esc(page.canonical))) failures.push(`${page.path}: missing from sitemap`);
const reachable = new Set(["/"]);
const pending = ["/"];
for (const path of pending) {
  for (const next of rendered.get(path) ?? []) {
    if (reachable.has(next)) continue;
    reachable.add(next);
    pending.push(next);
  }
}
for (const { path } of all) if (!reachable.has(path)) failures.push(`${path}: unreachable from the home page`);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`SEO validation passed: ${all.length} reachable preferred pages, ${redirects.length} redirects, ${terms.size} unique keyword mappings, and intact app assets.`);
