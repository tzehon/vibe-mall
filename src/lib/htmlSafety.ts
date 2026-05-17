import { formatStorefrontPrice, type StorefrontPromptProduct } from "@/lib/codex/prompt";

export type HtmlValidationResult =
  | {
      ok: true;
      html: string;
      title: string;
    }
  | {
      ok: false;
      error: string;
    };

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /<\s*script\b/i,
    message: "Generated HTML cannot include script tags."
  },
  {
    pattern: /<\s*iframe\b/i,
    message: "Generated HTML cannot include iframe tags."
  },
  {
    pattern: /<\s*object\b/i,
    message: "Generated HTML cannot include object tags."
  },
  {
    pattern: /<\s*embed\b/i,
    message: "Generated HTML cannot include embed tags."
  },
  {
    pattern: /<\s*form\b/i,
    message: "Generated HTML cannot include form tags."
  },
  {
    pattern: /<\s*link\b[^>]*\brel\s*=\s*["']?stylesheet/i,
    message: "Generated HTML cannot include external stylesheet links."
  },
  {
    pattern: /<\s*link\b[^>]*\bhref\s*=\s*["']?\s*(?:https?:|\/\/)/i,
    message: "Generated HTML cannot include external font or stylesheet links."
  },
  {
    pattern: /@import\b/i,
    message: "Generated HTML cannot include CSS imports."
  },
  {
    pattern: /@font-face\b/i,
    message: "Generated HTML cannot include external font declarations."
  },
  {
    pattern: /\burl\(\s*["']?\s*(?:https?:|\/\/)/i,
    message: "Generated HTML cannot include external CSS URLs."
  },
  {
    pattern: /\s+on[a-z]+\s*=/i,
    message: "Generated HTML cannot include inline event handlers."
  },
  {
    pattern: /javascript\s*:/i,
    message: "Generated HTML cannot include javascript: URLs."
  },
  {
    pattern: /\bfetch\s*\(/i,
    message: "Generated HTML cannot include fetch calls."
  },
  {
    pattern: /\bXMLHttpRequest\b/i,
    message: "Generated HTML cannot include XMLHttpRequest references."
  },
  {
    pattern: /\b(?:src|href)\s*=\s*["']\s*(?:https?:|\/\/)/i,
    message: "Generated HTML cannot include network requests."
  }
];

function stripMarkdownFences(value: string) {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:html)?\s*([\s\S]*?)\s*```$/i);

  if (fenced) {
    return fenced[1].trim();
  }

  return trimmed.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

export function extractGeneratedHtml(raw: string) {
  const withoutFences = stripMarkdownFences(raw);
  const doctypeIndex = withoutFences.search(/<!doctype\s+html/i);
  const htmlIndex = withoutFences.search(/<html[\s>]/i);
  const startIndex =
    doctypeIndex >= 0 ? doctypeIndex : htmlIndex >= 0 ? htmlIndex : -1;

  if (startIndex === -1) {
    return withoutFences.trim();
  }

  const candidate = withoutFences.slice(startIndex).trim();
  const closingHtmlMatch = candidate.match(/<\/html\s*>/i);

  if (!closingHtmlMatch || closingHtmlMatch.index === undefined) {
    return candidate;
  }

  return candidate
    .slice(0, closingHtmlMatch.index + closingHtmlMatch[0].length)
    .trim();
}

function decodeBasicEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function extractTitle(html: string, fallback: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const rawTitle = titleMatch?.[1] ?? h1Match?.[1] ?? fallback;
  const withoutTags = rawTitle.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return decodeBasicEntities(withoutTags).slice(0, 90) || fallback;
}

function containsProductName(html: string, productName: string) {
  return html.toLowerCase().includes(productName.toLowerCase());
}

function containsProductPrice(html: string, price: number) {
  return html.includes(formatStorefrontPrice(price));
}

export function validateGeneratedStorefrontHtml({
  html,
  products,
  fallbackTitle = "Vibe Mall storefront"
}: {
  html: string;
  products: StorefrontPromptProduct[];
  fallbackTitle?: string;
}): HtmlValidationResult {
  const extractedHtml = extractGeneratedHtml(html);

  if (!extractedHtml) {
    return { ok: false, error: "Codex returned an empty HTML response." };
  }

  if (!/^<!doctype\s+html/i.test(extractedHtml) && !/^<html[\s>]/i.test(extractedHtml)) {
    return {
      ok: false,
      error: "Generated output must be one complete HTML document, not markdown or a fragment."
    };
  }

  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(extractedHtml)) {
      return { ok: false, error: rule.message };
    }
  }

  for (const product of products) {
    if (!containsProductName(extractedHtml, product.name)) {
      return {
        ok: false,
        error: `Generated HTML is missing selected product name: ${product.name}.`
      };
    }

    if (!containsProductPrice(extractedHtml, product.price)) {
      return {
        ok: false,
        error: `Generated HTML is missing selected product price: ${formatStorefrontPrice(
          product.price
        )}.`
      };
    }
  }

  return {
    ok: true,
    html: extractedHtml,
    title: extractTitle(extractedHtml, fallbackTitle)
  };
}
