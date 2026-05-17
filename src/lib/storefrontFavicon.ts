const TREND_MALL_FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#151515"/><path fill="#087f7a" d="M15 25.2c.4-3.1 3-5.4 6.1-5.4h21.8c3.1 0 5.7 2.3 6.1 5.4l3.1 22.4A6.2 6.2 0 0 1 46 54.6H18a6.2 6.2 0 0 1-6.1-7l3.1-22.4Z"/><path fill="none" stroke="#fffdf7" stroke-linecap="round" stroke-width="4" d="M24 22.5V19c0-4.4 3.6-8 8-8s8 3.6 8 8v3.5"/><path fill="#b7d94f" d="m45.4 12.7 1.8 5.1 5.1 1.8-5.1 1.8-1.8 5.1-1.8-5.1-5.1-1.8 5.1-1.8 1.8-5.1Z"/></svg>`;

export const TREND_MALL_FAVICON_HREF = `data:image/svg+xml,${encodeURIComponent(
  TREND_MALL_FAVICON_SVG
)}`;

const FAVICON_TAG = `<link rel="icon" href="${TREND_MALL_FAVICON_HREF}" type="image/svg+xml" />`;

export function injectStorefrontFavicon(html: string) {
  if (/<link\b[^>]*\brel\s*=\s*["'][^"']*\bicon\b/i.test(html)) {
    return html;
  }

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}\n    ${FAVICON_TAG}`);
  }

  if (/<html[^>]*>/i.test(html)) {
    return html.replace(
      /<html[^>]*>/i,
      (match) => `${match}\n  <head>\n    ${FAVICON_TAG}\n  </head>`
    );
  }

  return `${FAVICON_TAG}\n${html}`;
}
