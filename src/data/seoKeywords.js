import { targets } from "./seoTargets.js";

export const keywordMap = Object.entries(targets).flatMap(([slug, target]) =>
  target.terms.map((keyword, index) => ({
    keyword,
    url: slug ? `/${slug}/` : "/",
    primary: index === 0,
  }))
);
