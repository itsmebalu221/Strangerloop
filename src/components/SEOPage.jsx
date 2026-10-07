import React from "react";

export function Breadcrumbs({ items }) {
  return <nav aria-label="Breadcrumb" className="seo-breadcrumbs">{items.map((item, index) => <React.Fragment key={item.url}><a href={item.url}>{item.label}</a>{index < items.length - 1 && <span aria-hidden="true">/</span>}</React.Fragment>)}</nav>;
}

export function SEOFAQ({ items }) {
  return <section className="seo-faq" aria-labelledby="faq-heading"><h2 id="faq-heading">Frequently asked questions</h2>{items.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</section>;
}

export function RelatedPages({ pages }) {
  return <section className="seo-related" aria-labelledby="related-heading"><h2 id="related-heading">Continue exploring</h2><div className="seo-link-grid">{pages.slice(0, 6).map((page) => <a key={page.path} href={page.path}><strong>{page.h1}</strong><span>{page.metaDescription}</span></a>)}</div></section>;
}

export function SEOPage({ page, related = [] }) {
  const crumbs = [{ label: "Home", url: "/" }, ...(page.parent ? [{ label: page.category.replace(/-/g, " "), url: page.parent }] : []), { label: page.h1, url: page.path }];
  return <main className="seo-page"><div className="seo-wrap"><Breadcrumbs items={crumbs} /><header className="seo-hero"><p className="seo-kicker">{page.category.replace(/-/g, " ")}</p><h1>{page.h1}</h1><p className="seo-intro">{page.intro}</p><a className="seo-cta" href="/">Start a conversation <span aria-hidden="true">-&gt;</span></a></header><div className="seo-content">{page.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2><p>{section.body}</p></section>)}</div><SEOFAQ items={page.faq} /><RelatedPages pages={related} /><section className="seo-cta-band"><h2>Find a conversation that feels worth having.</h2><p>StrangerLoop is an 18+ text-first way to meet people through shared interests.</p><a className="seo-cta" href="/">Open StrangerLoop <span aria-hidden="true">-&gt;</span></a></section></div></main>;
}

export default SEOPage;
