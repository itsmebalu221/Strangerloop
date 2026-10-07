import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { home, pages, SITE_URL } from "../src/data/seoPages.js";
import { keywordDatabase, keywordMap, totalKeywordCount } from "../src/data/seoKeywords.js";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "..", "dist");
const esc = (value) => String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" }[char]));
const url = (path) => `${SITE_URL}${path}`;
const allPages = [home, ...pages];
const byCategory = new Map();
for (const page of pages) {
  const list = byCategory.get(page.category) || [];
  list.push(page);
  byCategory.set(page.category, list);
}

const styles = `:root{font-family:DM Sans,Arial,sans-serif;color:#14261f;background:#f4f6ef}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top right,#dcf3e8 0,transparent 32rem),#f4f6ef;color:#14261f}a{color:inherit}.seo-shell{max-width:1120px;margin:auto;padding:24px 22px 72px}.seo-nav{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #14261f;padding:12px 0 18px}.brand{font:800 1.45rem 'Arial Black',sans-serif;text-decoration:none}.brand span{color:#ff4b2e}.nav-cta,.seo-cta{display:inline-flex;gap:10px;align-items:center;background:#ff4b2e;color:#fff6f0;border:2px solid #14261f;border-radius:12px;padding:12px 18px;font-weight:800;text-decoration:none;box-shadow:3px 3px 0 #14261f}.seo-breadcrumbs{display:flex;flex-wrap:wrap;gap:8px;margin:34px 0 22px;color:#45584e;font-size:.9rem}.seo-breadcrumbs a{text-decoration:none}.seo-breadcrumbs a:hover{text-decoration:underline}.seo-kicker{text-transform:uppercase;letter-spacing:.12em;color:#0f5d4e;font-weight:800;font-size:.78rem}.seo-hero{max-width:820px;padding:24px 0 44px}.seo-hero h1{font:800 clamp(2.4rem,6vw,5.5rem)/.98 'Arial Black',Arial,sans-serif;letter-spacing:-.05em;margin:12px 0 20px}.seo-intro{font-size:1.25rem;line-height:1.6;max-width:760px;color:#45584e;margin:0 0 30px}.seo-content{max-width:820px}.seo-content section{border-top:2px solid rgba(20,38,31,.18);padding:28px 0}.seo-content h2,.seo-faq h2,.seo-related h2,.seo-cta-band h2{font:800 1.7rem/1.1 'Arial Black',Arial,sans-serif;margin:0 0 12px}.seo-content p,.seo-faq p{font-size:1.05rem;line-height:1.75;margin:0;color:#45584e}.seo-faq{max-width:820px;margin-top:22px}.seo-faq details{border-top:1px solid rgba(20,38,31,.2);padding:17px 0}.seo-faq summary{cursor:pointer;font-weight:800}.seo-faq p{padding:12px 0 0}.seo-related{border-top:2px solid rgba(20,38,31,.18);margin-top:42px;padding-top:28px}.seo-link-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}.seo-link-grid a{display:flex;flex-direction:column;gap:8px;background:#fff;border:2px solid rgba(20,38,31,.15);border-radius:12px;padding:17px;text-decoration:none}.seo-link-grid a:hover{border-color:#14261f;transform:translateY(-2px)}.seo-link-grid span{font-size:.9rem;line-height:1.45;color:#45584e}.seo-cta-band{margin-top:46px;background:#14261f;color:#f4f6ef;padding:30px;border-radius:16px}.seo-cta-band p{color:#b9c4b6;line-height:1.6}.seo-footer{border-top:2px solid rgba(20,38,31,.18);margin-top:54px;padding-top:24px;color:#45584e;font-size:.9rem}.seo-footer a{margin-right:16px}.seo-footer p{line-height:1.6}@media(max-width:640px){.seo-shell{padding:16px 18px 54px}.nav-cta{padding:10px 12px;font-size:.85rem}.seo-hero h1{font-size:2.65rem}.seo-intro{font-size:1.08rem}.seo-content h2,.seo-faq h2,.seo-related h2,.seo-cta-band h2{font-size:1.35rem}}`;

function schemaFor(page, related) {
  const breadcrumbs = [{ name: "Home", item: url("/") }];
  if (page.parent) breadcrumbs.push({ name: page.category.replace(/-/g, " "), item: url(page.parent) });
  if (page.path !== "/") breadcrumbs.push({ name: page.h1, item: url(page.path) });
  const graph = [
    { "@type": page.schemaType === "Article" ? "Article" : "WebPage", "@id": `${url(page.path)}#page`, url: url(page.path), name: page.title, description: page.metaDescription, isPartOf: { "@id": `${SITE_URL}/#website` }, breadcrumb: { "@id": `${url(page.path)}#breadcrumb` } },
    { "@type": "BreadcrumbList", "@id": `${url(page.path)}#breadcrumb`, itemListElement: breadcrumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: crumb.item })) }
  ];
  if (page.path === "/") {
    graph[0] = { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: "StrangerLoop", description: page.metaDescription, publisher: { "@id": `${SITE_URL}/#organization` } };
    graph.push({ "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "StrangerLoop", url: SITE_URL });
  }
  if (page.schemaType === "Article") graph[0].headline = page.h1;
  if (page.faq?.length) graph.push({ "@type": "FAQPage", mainEntity: page.faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) });
  return { "@context": "https://schema.org", "@graph": graph };
}

function relatedFor(page) {
  const candidates = [...(byCategory.get(page.category) || []), ...(page.parent ? pages.filter((item) => item.parent === page.parent) : []), ...pages.filter((item) => item.category === "guides")];
  return [...new Map(candidates.filter((item) => item.path !== page.path).map((item) => [item.path, item])).values()].slice(0, 6);
}

function pageHtml(page, isHome = false) {
  const related = isHome ? pages.slice(0, 6) : relatedFor(page);
  const crumbs = [{ label: "Home", url: "/" }, ...(page.parent ? [{ label: page.category.replace(/-/g, " "), url: page.parent }] : []), ...(isHome ? [] : [{ label: page.h1, url: page.path }])];
  const sectionHtml = page.sections.map((section) => `<section><h2>${esc(section.heading)}</h2><p>${esc(section.body)}</p></section>`).join("");
  const faqHtml = page.faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join("");
  const linksHtml = related.map((item) => `<a href="${item.path}"><strong>${esc(item.h1)}</strong><span>${esc(item.metaDescription)}</span></a>`).join("");
  const crumbHtml = crumbs.map((item, index) => `${index ? `<span aria-hidden="true">/</span>` : ""}<a href="${item.url}">${esc(item.label)}</a>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(page.title)}</title><meta name="description" content="${esc(page.metaDescription)}"><link rel="canonical" href="${url(page.path)}"><meta property="og:type" content="${page.schemaType === "Article" ? "article" : "website"}"><meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.metaDescription)}"><meta property="og:url" content="${url(page.path)}"><meta property="og:site_name" content="StrangerLoop"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(page.title)}"><meta name="twitter:description" content="${esc(page.metaDescription)}"><script type="application/ld+json">${JSON.stringify(schemaFor(page, related))}</script><style>${styles}</style></head><body><div class="seo-shell"><nav class="seo-nav"><a class="brand" href="/">Stranger<span>Loop</span></a><a class="nav-cta" href="/">Start chatting -&gt;</a></nav><div class="seo-breadcrumbs" aria-label="Breadcrumb">${crumbHtml}</div><header class="seo-hero"><p class="seo-kicker">${esc(page.category.replace(/-/g, " "))}</p><h1>${esc(page.h1)}</h1><p class="seo-intro">${esc(page.intro)}</p><a class="seo-cta" href="/">Start a conversation <span aria-hidden="true">-&gt;</span></a></header><div class="seo-content">${sectionHtml}</div><section class="seo-faq"><h2>Frequently asked questions</h2>${faqHtml}</section><section class="seo-related"><h2>Continue exploring</h2><div class="seo-link-grid">${linksHtml}</div></section><section class="seo-cta-band"><h2>Find a conversation that feels worth having.</h2><p>StrangerLoop is an 18+ text-first way to meet people through shared interests.</p><a class="seo-cta" href="/">Open StrangerLoop <span aria-hidden="true">-&gt;</span></a></section><footer class="seo-footer"><a href="/random-chat/">Chat</a><a href="/interests/">Interests</a><a href="/conversation-starters/">Guides</a><a href="/online-chat-safety/">Safety</a><a href="/">About</a><p>StrangerLoop is designed for adults 18 and over. Do not share passwords, financial information, or precise location details with a new online contact.</p></footer></div></body></html>`;
}

async function writePage(page, isHome = false) {
  const output = isHome ? join(dist, "index.html") : join(dist, page.slug, "index.html");
  await mkdir(dirname(output), { recursive: true });
  if (isHome) {
    const existing = await readFile(output, "utf8");
    const body = pageHtml(page, true).match(/<body>([\s\S]*)<\/body>/)?.[1] || "";
    const head = pageHtml(page, true).match(/<head>([\s\S]*)<\/head>/)?.[1] || "";
    const appShell = existing.match(/<div id="root"><\/div>/)?.[0] || '<div id="root"></div>';
    const scripts = existing.match(/<script type="module"[^>]*><\/script>/g)?.join("") || existing.match(/<script type="module"[^>]*><\/script>/g)?.join("") || "";
    const fallbackScript = existing.match(/<script type="module"[^>]*><\/script>/)?.[0] || "";
    const appScript = scripts || fallbackScript;
    await writeFile(output, existing.replace(/<head>[\s\S]*<\/head>/, `<head>${head}</head>`).replace(/<body>[\s\S]*<\/body>/, `<body>${body}<div id="root"></div>${appScript}</body>`));
    return;
  }
  await writeFile(output, pageHtml(page));
}

const urls = allPages.filter((page) => page.indexable).map((page) => `  <url><loc>${esc(url(page.path))}</loc><changefreq>monthly</changefreq></url>`).join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
const robots = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /settings/\nDisallow: /account/\nDisallow: /profile/\nDisallow: /internal/\nDisallow: /debug/\nSitemap: ${SITE_URL}/sitemap.xml\n`;
const report = `# SEO Implementation Report\n\nGenerated: ${new Date().toISOString()}\n\n- Total SEO pages: ${pages.length}\n- Total indexable pages: ${allPages.filter((page) => page.indexable).length}\n- Total keyword database entries: ${totalKeywordCount}\n- Keyword clusters: ${keywordDatabase.map((item) => item.cluster).join(", ")}\n- Sitemap URLs: ${allPages.filter((page) => page.indexable).length}\n- Canonical strategy: self-referencing production URLs with trailing slashes.\n- Robots strategy: public SEO pages allowed; administrative and account paths disallowed.\n- Structured data: WebPage/WebSite, BreadcrumbList, FAQPage where FAQs exist, and Article for blog pages.\n\n## Indexable URLs\n\n${allPages.filter((page) => page.indexable).map((page) => `- ${page.path} — ${page.h1}`).join("\n")}\n`;

await mkdir(dist, { recursive: true });
await writePage(home, true);
for (const page of pages) await writePage(page);
await writeFile(join(dist, "sitemap.xml"), sitemap);
await writeFile(join(dist, "robots.txt"), robots);
await writeFile(join(process.cwd(), "SEO_IMPLEMENTATION_REPORT.md"), report);
await writeFile(join(process.cwd(), "KEYWORD_MAP.md"), `# Keyword Map\n\nEach primary keyword has one canonical target URL.\n\n${keywordMap.map((item) => `- **${item.keyword}** -> ${item.url}`).join("\n")}\n`);
console.log(`Generated ${allPages.length} SEO pages, ${totalKeywordCount} mapped keyword terms, sitemap.xml, robots.txt, SEO_IMPLEMENTATION_REPORT.md, and KEYWORD_MAP.md.`);
