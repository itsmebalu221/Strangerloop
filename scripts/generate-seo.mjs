import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { home, pages, redirects, SITE_URL } from "../src/data/seoPages.js";
import { keywordMap } from "../src/data/seoKeywords.js";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "..", "dist");
const esc = (value) => String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" }[char]));
const url = (path) => `${SITE_URL}${path}`;
const allPages = [home, ...pages];
const byPath = new Map(allPages.map((page) => [page.path, page]));
const pathFor = (slug) => slug ? `/${slug}/` : "/";
const hrefFrom = (from, to) => {
  const relative = posix.relative(from, to);
  return relative ? `${relative}/` : "./";
};
const site = new URL(SITE_URL);
if (!['http:', 'https:'].includes(site.protocol) || site.username || site.password || site.search || site.hash) {
  throw new Error("SEO_SITE_URL must be an HTTP(S) site URL with an optional deployment path.");
}
const byCategory = new Map();
for (const page of pages) {
  const list = byCategory.get(page.category) || [];
  list.push(page);
  byCategory.set(page.category, list);
}

const styles = `:root{font-family:DM Sans,Arial,sans-serif;color:#14261f;background:#f4f6ef}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top right,#dcf3e8 0,transparent 32rem),#f4f6ef;color:#14261f}a{color:inherit}.seo-shell{max-width:1120px;margin:auto;padding:24px 22px 72px}.seo-nav{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #14261f;padding:12px 0 18px}.brand{font:800 1.45rem 'Arial Black',sans-serif;text-decoration:none}.brand span{color:#ff4b2e}.nav-cta,.seo-cta{display:inline-flex;gap:10px;align-items:center;background:#ff4b2e;color:#fff6f0;border:2px solid #14261f;border-radius:12px;padding:12px 18px;font-weight:800;text-decoration:none;box-shadow:3px 3px 0 #14261f}.seo-breadcrumbs{display:flex;flex-wrap:wrap;gap:8px;margin:34px 0 22px;color:#45584e;font-size:.9rem}.seo-breadcrumbs a{text-decoration:none}.seo-breadcrumbs a:hover{text-decoration:underline}.seo-kicker{text-transform:uppercase;letter-spacing:.12em;color:#0f5d4e;font-weight:800;font-size:.78rem}.seo-hero{max-width:820px;padding:24px 0 44px}.seo-hero h1{font:800 clamp(2.4rem,6vw,5.5rem)/.98 'Arial Black',Arial,sans-serif;letter-spacing:-.05em;margin:12px 0 20px}.seo-intro{font-size:1.25rem;line-height:1.6;max-width:760px;color:#45584e;margin:0 0 30px}.seo-content{max-width:820px}.seo-content section{border-top:2px solid rgba(20,38,31,.18);padding:28px 0}.seo-content h2,.seo-faq h2,.seo-related h2,.seo-cta-band h2{font:800 1.7rem/1.1 'Arial Black',Arial,sans-serif;margin:0 0 12px}.seo-content p,.seo-faq p{font-size:1.05rem;line-height:1.75;margin:0;color:#45584e}.seo-faq{max-width:820px;margin-top:22px}.seo-faq details{border-top:1px solid rgba(20,38,31,.2);padding:17px 0}.seo-faq summary{cursor:pointer;font-weight:800}.seo-faq p{padding:12px 0 0}.seo-related{border-top:2px solid rgba(20,38,31,.18);margin-top:42px;padding-top:28px}.seo-link-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}.seo-link-grid a{display:flex;flex-direction:column;gap:8px;background:#fff;border:2px solid rgba(20,38,31,.15);border-radius:12px;padding:17px;text-decoration:none}.seo-link-grid a:hover{border-color:#14261f;transform:translateY(-2px)}.seo-link-grid span{font-size:.9rem;line-height:1.45;color:#45584e}.seo-cta-band{margin-top:46px;background:#14261f;color:#f4f6ef;padding:30px;border-radius:16px}.seo-cta-band p{color:#b9c4b6;line-height:1.6}.seo-footer{border-top:2px solid rgba(20,38,31,.18);margin-top:54px;padding-top:24px;color:#45584e;font-size:.9rem}.seo-footer a{margin-right:16px}.seo-footer p{line-height:1.6}@media(max-width:640px){.seo-shell{padding:16px 18px 54px}.nav-cta{padding:10px 12px;font-size:.85rem}.seo-hero h1{font-size:2.65rem}.seo-intro{font-size:1.08rem}.seo-content h2,.seo-faq h2,.seo-related h2,.seo-cta-band h2{font-size:1.35rem}}`;

function schemaFor(page) {
  if (page.path === "/") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: url("/"), name: "StrangrLoop", description: page.metaDescription, publisher: { "@id": `${SITE_URL}/#organization` } },
        { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "StrangrLoop", url: url("/") },
      ],
    };
  }
  const breadcrumbs = [{ name: "Home", item: url("/") }];
  if (page.parent && page.parent !== "/") breadcrumbs.push({ name: byPath.get(page.parent).h1, item: url(page.parent) });
  breadcrumbs.push({ name: page.h1, item: url(page.path) });
  const graph = [
    { "@type": page.schemaType === "Article" ? "Article" : "WebPage", "@id": `${url(page.path)}#page`, url: url(page.path), name: page.title, description: page.metaDescription, isPartOf: { "@id": `${SITE_URL}/#website` }, breadcrumb: { "@id": `${url(page.path)}#breadcrumb` } },
    { "@type": "BreadcrumbList", "@id": `${url(page.path)}#breadcrumb`, itemListElement: breadcrumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: crumb.item })) }
  ];
  if (page.schemaType === "Article") graph[0].headline = page.h1;
  if (page.faq?.length) graph.push({ "@type": "FAQPage", mainEntity: page.faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) });
  return { "@context": "https://schema.org", "@graph": graph };
}

function relatedFor(page) {
  const preferred = page.related.map((slug) => byPath.get(pathFor(slug)));
  const candidates = [...preferred, ...(byCategory.get(page.category) ?? []), ...byCategory.get("guides")];
  return [...new Map(candidates.filter((item) => item && item.path !== page.path).map((item) => [item.path, item])).values()].slice(0, Math.max(6, preferred.length));
}

function metadata(page) {
  const title = esc(page.title);
  const description = esc(page.metaDescription);
  const canonical = esc(page.canonical);
  const json = JSON.stringify(schemaFor(page)).replace(/</g, "\\u003c");
  return `<title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="${page.schemaType === "Article" ? "article" : "website"}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}"><meta property="og:site_name" content="StrangrLoop"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><script type="application/ld+json">${json}</script>`;
}

function content(page) {
  const isHome = page.path === "/";
  const href = (path) => esc(hrefFrom(page.path, path));
  const start = isHome ? "#root" : href("/");
  const parent = page.parent && page.parent !== "/" ? byPath.get(page.parent) : null;
  const crumbs = isHome ? "" : `<nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="${href("/")}">Home</a>${parent ? ` / <a href="${href(parent.path)}">${esc(parent.h1)}</a>` : ""} / <span>${esc(page.h1)}</span></nav>`;
  const sections = page.sections.map(({ heading, body }) => `<section><h2>${esc(heading)}</h2><p>${esc(body)}</p></section>`).join("");
  const faq = page.faq.map(({ q, a }) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");
  const related = relatedFor(page);
  const children = pages.filter((item) => item.parent === page.path || (isHome && !item.parent));
  const links = [...new Map([...related, ...children].map((item) => [item.path, item])).values()]
    .map((item) => `<a href="${href(item.path)}"><strong>${esc(item.h1)}</strong><span>${esc(item.metaDescription)}</span></a>`).join("");
  const sources = page.sources.map(([label, link]) => `<li><a href="${esc(link)}">${esc(label)}</a></li>`).join("");
  const heading = isHome ? "h2" : "h1";
  return `<div class="seo-shell">${isHome ? "" : `<nav class="seo-nav"><a class="brand" href="${href("/")}">Strangr<span>Loop</span></a><a class="nav-cta" href="${start}">Open chat</a></nav>`}${crumbs}<header class="seo-hero"><${heading}>${esc(page.h1)}</${heading}><p class="seo-intro">${esc(page.intro)}</p><a class="seo-cta" href="${start}">Open chat</a></header><div class="seo-content">${sections}${sources ? `<section><h2>Sources</h2><ul>${sources}</ul></section>` : ""}</div><section class="seo-faq"><h2>Frequently asked questions</h2>${faq}</section><section class="seo-related"><h2>Related topics</h2><div class="seo-link-grid">${links}</div></section></div>`;
}

async function writePage(page) {
  const output = join(dist, page.slug, "index.html");
  await mkdir(dirname(output), { recursive: true });
  if (page.path === "/") {
    const existing = await readFile(output, "utf8");
    // Preserve Vite's CSS, fonts, scripts, and preloads. Replace only the tags
    // and content this generator owns, including on a repeated run.
    const start = "<!-- seo:start -->";
    const end = "<!-- seo:end -->";
    const homeStyles = styles.slice(styles.indexOf(".seo-shell")) + ".seo-hero h2{font-weight:800;font-size:clamp(2rem,5vw,3.4rem);line-height:1.1;margin:0 0 16px}";
    const updated = existing
      .replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->\r?\n?/g, "")
      .replace(/<title>[^<]*<\/title>\s*|<link rel="canonical"[^>]*>\s*|<meta (?:name="(?:description|twitter:[^"]+)"|property="og:[^"]+")[^>]*>\s*/g, "")
      .replace("</head>", () => `${start}${metadata(page)}<style>${homeStyles}</style>${end}\n</head>`)
      .replace("</body>", () => `${start}${content(page)}${end}\n</body>`);
    await writeFile(output, updated);
    return;
  }
  await writeFile(output, `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">${metadata(page)}<style>${styles}</style></head><body><main>${content(page)}</main></body></html>`);
}

async function writeRedirect({ from, to }) {
  const output = join(dist, from.slice(1), "index.html");
  const href = esc(hrefFrom(from, to));
  const title = esc(byPath.get(to).h1);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><link rel="canonical" href="${esc(url(to))}"><meta http-equiv="refresh" content="0;url=${href}"></head><body><p>This page has moved. <a href="${href}">${title}</a></p></body></html>`);
}

const urls = allPages.filter((page) => page.indexable).map((page) => `  <url><loc>${esc(page.canonical)}</loc></url>`).join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
const robots = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /settings/\nDisallow: /account/\nDisallow: /profile/\nDisallow: /internal/\nDisallow: /debug/\nSitemap: ${SITE_URL}/sitemap.xml\n`;
const report = `# SEO Implementation Report\n\n- Preferred URLs in sitemap: ${allPages.length}\n- Older URL variants forwarded to preferred pages: ${redirects.length}\n- Curated search terms: ${keywordMap.length} across ${new Set(keywordMap.map(({ url }) => url)).size} priority pages\n- Canonical URLs use the deployment site address and path. Internal links work on both a root domain and a GitHub Pages project subpath.\n- The homepage keeps the chat app and Vite assets above the public guides.\n\n## Research sources\n\n- [Chitchat](https://www.chitchat.gg/), [Joingy](https://joingy.com/), [Chitmet](https://chitmet.gg/text-chat-with-strangers), and [RandomHey](https://randomhey.com/text-chat) cover random one-on-one text chat, no-camera searches, and Omegle text alternatives.\n- [Stranger Talk](https://www.strangertalk.in/) covers India and regional language chat. [Emerald Chat](https://emeraldchat.com/blog/how-to-filter-matches-to-meet-the-right-people-on-emerald-chat/) documents interest-based matching.\n- Public search results and competitor pages informed the term selection. Search volume, keyword difficulty, and current StrangrLoop positions are unknown.\n\n## Preferred URLs\n\n${allPages.map((page) => `- ${page.path} — ${page.h1}`).join("\n")}\n`;

await mkdir(dist, { recursive: true });
for (const page of allPages) await writePage(page);
for (const redirect of redirects) await writeRedirect(redirect);
await writeFile(join(dist, "sitemap.xml"), sitemap);
await writeFile(join(dist, "robots.txt"), robots);
await writeFile(join(process.cwd(), "SEO_IMPLEMENTATION_REPORT.md"), report);
await writeFile(join(process.cwd(), "KEYWORD_MAP.md"), `# Keyword Map\n\nEach group has one preferred URL. Terms describe the intent covered by the page copy and FAQs.\n\n${keywordMap.map(({ keyword, url, primary }) => primary ? `\n## ${keyword}\n\n- Preferred URL: \`${url}\`` : `- ${keyword}`).join("\n").trimStart()}\n`);
console.log(`Generated ${allPages.length} preferred pages, ${redirects.length} legacy redirects, and ${keywordMap.length} mapped terms.`);
