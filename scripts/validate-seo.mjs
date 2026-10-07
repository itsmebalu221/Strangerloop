import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pages, home, SITE_URL } from "../src/data/seoPages.js";

const root = process.cwd();
const all = [home, ...pages];
const failures = [];
const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();
for (const page of all) {
  if (!page.h1) failures.push(`${page.path}: missing H1`);
  if (!page.title) failures.push(`${page.path}: missing title`);
  if (!page.metaDescription) failures.push(`${page.path}: missing meta description`);
  if (!page.canonical?.startsWith(SITE_URL)) failures.push(`${page.path}: invalid canonical`);
  if (!page.sections?.length) failures.push(`${page.path}: missing content sections`);
  if (!page.faq?.length) failures.push(`${page.path}: missing FAQ`);
  for (const [value, label, map] of [[page.title, "title", titles], [page.metaDescription, "description", descriptions], [page.canonical, "canonical", canonicals]]) {
    const previous = map.get(value);
    if (previous) failures.push(`${page.path}: duplicate ${label} with ${previous}`);
    map.set(value, page.path);
  }
  if (page.indexable && page.path !== "/" && !page.parent && !["interests", "blog"].includes(page.category)) failures.push(`${page.path}: orphan page without parent`);
}
const sitemap = await readFile(join(root, "dist", "sitemap.xml"), "utf8").catch(() => "");
for (const page of all.filter((item) => item.indexable)) if (!sitemap.includes(page.canonical)) failures.push(`${page.path}: missing from sitemap`);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`SEO validation passed: ${all.length} pages, ${titles.size} unique titles, ${descriptions.size} unique descriptions, ${canonicals.size} unique canonicals.`);
