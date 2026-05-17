import type { ModelReasoningEffort, ThreadEvent, ThreadItem, Usage } from "@openai/codex-sdk";

import { buildCodexStorefrontPrompt, formatStorefrontPrice } from "@/lib/codex/prompt";
import type { ProductSearchResult } from "@/lib/productSearch";
import { VIBE_MALL_FAVICON_HREF } from "@/lib/storefrontFavicon";

export type GenerateStorefrontInput = {
  vibe: string;
  products: ProductSearchResult[];
  onCodeDelta?: (delta: string, totalLength: number) => void;
  onProgress?: (message: string) => void;
};

export type GenerateStorefrontResult = {
  html: string;
  codexThreadId?: string;
  rawSummary: string;
};

const CODEX_REASONING_EFFORT_VALUES = ["none", "low", "medium", "high", "xhigh"] as const;
type CodexRuntimeReasoningEffort = (typeof CODEX_REASONING_EFFORT_VALUES)[number];

function isCodexRuntimeReasoningEffort(value: string): value is CodexRuntimeReasoningEffort {
  return CODEX_REASONING_EFFORT_VALUES.includes(value as CodexRuntimeReasoningEffort);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeCssColor(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  if (/^#[0-9a-f]{3,8}$/i.test(value) || /^[a-z][a-z0-9 -]{1,28}$/i.test(value)) {
    return value;
  }

  return fallback;
}

function campaignNameFromVibe(vibe: string) {
  const words = vibe
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`);

  return words.length ? `${words.join(" ")} Shelf` : "Vibe Mall Shelf";
}

function buildMicroPitch(vibe: string, product: ProductSearchResult, index: number) {
  const tag = product.tags[index % Math.max(product.tags.length, 1)] ?? product.category;

  return `A ${escapeHtml(tag)} pick tuned for ${escapeHtml(
    vibe
  )} shoppers who want the shelf to feel instantly shareable.`;
}

function generateDemoHtml({ vibe, products }: GenerateStorefrontInput) {
  const campaignName = campaignNameFromVibe(vibe);
  const safeVibe = escapeHtml(vibe);
  const firstProduct = products[0];
  const accent = safeCssColor(firstProduct?.palette[0], "#087f7a");
  const accentTwo = safeCssColor(firstProduct?.palette[1], "#e0523f");
  const accentThree = safeCssColor(firstProduct?.palette[2], "#3157a4");
  const cards = products
    .map((product, index) => {
      const safeName = escapeHtml(product.name);
      const safeCategory = escapeHtml(product.category);
      const safeBrand = escapeHtml(product.brand);
      const price = formatStorefrontPrice(product.price);
      const borderColor = safeCssColor(product.palette[index % product.palette.length], accent);

      return `<article class="product-card" style="--card-accent: ${borderColor}">
        <div class="image-wrap">
          <img src="${product.imageDataUri}" alt="Product image" />
        </div>
        <div class="card-copy">
          <p class="category">${safeCategory} / ${safeBrand}</p>
          <h2>${safeName}</h2>
          <p class="pitch">${buildMicroPitch(vibe, product, index)}</p>
          <p class="price">${price}</p>
        </div>
      </article>`;
    })
    .join("\n");
  const flightPaths = [
    { fromX: "10%", fromY: "22%", midX: "34%", midY: "30%" },
    { fromX: "18%", fromY: "74%", midX: "42%", midY: "52%" },
    { fromX: "58%", fromY: "24%", midX: "50%", midY: "36%" },
    { fromX: "76%", fromY: "70%", midX: "58%", midY: "54%" }
  ];
  const cartFlightItems = products
    .slice(0, 4)
    .map((product, index) => {
      const path = flightPaths[index % flightPaths.length];
      const label = product.name.split(/\s+/).filter(Boolean).slice(0, 2).join(" ") || product.name;
      const itemColor = safeCssColor(product.palette[index % product.palette.length], accent);

      return `<span class="cart-item" style="--i: ${index}; --from-x: ${path.fromX}; --from-y: ${path.fromY}; --mid-x: ${path.midX}; --mid-y: ${path.midY}; --item-color: ${itemColor}">
            <img src="${product.imageDataUri}" alt="" />
            <b>${escapeHtml(label)}</b>
          </span>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="${VIBE_MALL_FAVICON_HREF}" type="image/svg+xml" />
    <title>${escapeHtml(campaignName)}</title>
    <style>
      :root {
        --ink: #141414;
        --paper: #fffdf8;
        --muted: #5c5a54;
        --line: rgba(20, 20, 20, 0.14);
        --accent: ${accent};
        --accent-two: ${accentTwo};
        --accent-three: ${accentThree};
      }

      * {
        box-sizing: border-box;
      }

      body {
        background:
          radial-gradient(circle at 20% 0%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 32rem),
          linear-gradient(135deg, #fff9ea 0%, #f4f8ff 54%, #fff5f1 100%);
        color: var(--ink);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.5;
        margin: 0;
      }

      main {
        margin: 0 auto;
        max-width: 1160px;
        padding: 48px 20px;
      }

      .hero {
        border-bottom: 1px solid var(--line);
        display: grid;
        gap: 28px;
        grid-template-columns: minmax(0, 1.1fr) minmax(240px, 0.7fr);
        padding: 28px 0 42px;
      }

      .kicker,
      .category,
      footer {
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .kicker {
        color: var(--accent);
      }

      h1 {
        font-size: clamp(2.8rem, 8vw, 6.8rem);
        line-height: 0.9;
        margin: 10px 0 20px;
        max-width: 880px;
      }

      .why {
        color: var(--muted);
        font-size: clamp(1.05rem, 2vw, 1.35rem);
        max-width: 680px;
      }

      .hero-badge {
        align-self: end;
        background: var(--ink);
        border-radius: 8px;
        color: var(--paper);
        padding: 22px;
      }

      .hero-badge strong {
        display: block;
        font-size: 2.6rem;
        line-height: 1;
      }

      .product-grid {
        display: grid;
        gap: 18px;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        padding: 34px 0;
      }

      .product-card {
        background: rgba(255, 253, 248, 0.88);
        border: 1px solid var(--line);
        border-top: 6px solid var(--card-accent);
        border-radius: 8px;
        overflow: hidden;
      }

      .image-wrap {
        align-items: center;
        aspect-ratio: 1;
        background: color-mix(in srgb, var(--card-accent) 16%, white);
        display: flex;
        justify-content: center;
        padding: 18px;
      }

      img {
        display: block;
        height: 100%;
        object-fit: contain;
        width: 100%;
      }

      .card-copy {
        padding: 16px;
      }

      .category {
        color: var(--accent-three);
        margin: 0 0 9px;
      }

      h2 {
        font-size: 1.05rem;
        line-height: 1.15;
        margin: 0 0 10px;
      }

      .pitch {
        color: var(--muted);
        font-size: 0.94rem;
        min-height: 4.2em;
      }

      .price {
        background: var(--ink);
        border-radius: 6px;
        color: var(--paper);
        display: inline-flex;
        font-weight: 900;
        margin: 10px 0 0;
        padding: 7px 9px;
      }

      .checkout {
        background:
          radial-gradient(circle at 88% 18%, color-mix(in srgb, var(--accent-three) 42%, transparent), transparent 170px),
          linear-gradient(135deg, var(--accent-two), color-mix(in srgb, var(--accent-two) 66%, white));
        border: 1px solid rgba(20, 20, 20, 0.16);
        border-radius: 8px;
        color: var(--ink);
        display: grid;
        gap: 8px;
        margin: 8px 0 26px;
        min-height: 320px;
        padding: 24px;
        position: relative;
        overflow: hidden;
      }

      .checkout-copy {
        max-width: 760px;
        position: relative;
        z-index: 2;
      }

      .checkout h2 {
        font-size: clamp(1.6rem, 4vw, 2.8rem);
        margin: 0;
      }

      .checkout-action {
        align-items: end;
        display: flex;
        min-height: 120px;
        padding-top: 28px;
        position: relative;
        z-index: 4;
      }

      .cart-cta {
        background: var(--paper);
        border: 1px solid rgba(20, 20, 20, 0.18);
        border-radius: 8px;
        box-shadow: 0 16px 34px rgba(20, 20, 20, 0.16);
        color: var(--ink);
        display: inline-flex;
        font-weight: 900;
        justify-content: center;
        margin-top: 10px;
        max-width: max-content;
        padding: 11px 14px;
        position: relative;
        text-decoration: none;
        transition:
          box-shadow 160ms ease,
          transform 160ms ease;
        z-index: 5;
      }

      .cart-cta:hover,
      .cart-cta:focus-visible {
        box-shadow: 0 22px 44px rgba(20, 20, 20, 0.22);
        transform: translateY(-2px) rotate(-1deg);
      }

      .cart-pop {
        inset: auto 0 0 0;
        min-height: 190px;
        opacity: 0;
        pointer-events: none;
        position: absolute;
        z-index: 3;
      }

      .cart-item {
        align-items: center;
        background: var(--paper);
        border: 2px solid rgba(20, 20, 20, 0.2);
        border-top: 7px solid var(--item-color);
        border-radius: 8px;
        box-shadow: 0 18px 44px rgba(20, 20, 20, 0.22);
        display: grid;
        gap: 8px;
        grid-template-columns: 44px minmax(0, 1fr);
        left: var(--from-x);
        max-width: 190px;
        opacity: 0;
        padding: 8px 10px 8px 8px;
        position: absolute;
        top: var(--from-y);
        transform: translate(-50%, -50%) scale(0.72) rotate(-8deg);
        width: min(42vw, 180px);
      }

      .cart-item img {
        aspect-ratio: 1;
        background: color-mix(in srgb, var(--item-color) 20%, white);
        border: 1px solid rgba(20, 20, 20, 0.12);
        border-radius: 6px;
        height: 44px;
        object-fit: contain;
        padding: 4px;
        width: 44px;
      }

      .cart-item b {
        font-size: 0.82rem;
        line-height: 1.05;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .cart-success {
        align-items: center;
        background: var(--ink);
        border-radius: 8px;
        bottom: 22px;
        box-shadow: 0 18px 40px rgba(20, 20, 20, 0.22);
        color: var(--paper);
        display: inline-flex;
        gap: 8px;
        font-weight: 900;
        opacity: 0;
        padding: 10px 14px;
        position: absolute;
        right: 24px;
        transform: translateY(16px) scale(0.9);
      }

      .cart-success::before {
        background: var(--accent);
        border-radius: 999px;
        color: var(--ink);
        content: "+";
        display: inline-grid;
        height: 22px;
        place-items: center;
        width: 22px;
      }

      .cart-pop:target {
        animation: cartOverlay 2600ms ease-out both;
      }

      .cart-pop:target .cart-item {
        animation: itemIntoCart 2300ms cubic-bezier(0.16, 1, 0.3, 1) both;
        animation-delay: calc(var(--i) * 140ms);
      }

      .cart-pop:target .cart-success {
        animation: cartSuccess 2600ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      .cart-pop:target + .checkout-action .cart-cta,
      .cart-cta:active {
        animation: cartButtonCatch 2600ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      @keyframes cartOverlay {
        0% { opacity: 0; }
        8% { opacity: 1; }
        84% { opacity: 1; }
        100% { opacity: 0; }
      }

      @keyframes itemIntoCart {
        0% {
          left: var(--from-x);
          opacity: 0;
          top: var(--from-y);
          transform: translate(-50%, -50%) scale(0.72) rotate(-10deg);
        }
        12% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.04) rotate(2deg);
        }
        46% {
          left: var(--mid-x);
          opacity: 1;
          top: var(--mid-y);
          transform: translate(-50%, -50%) scale(0.96) rotate(-3deg);
        }
        76% {
          left: 132px;
          opacity: 1;
          top: calc(100% - 40px);
          transform: translate(-50%, -50%) scale(0.48) rotate(8deg);
        }
        100% {
          left: 104px;
          opacity: 0;
          top: calc(100% - 24px);
          transform: translate(-50%, -50%) scale(0.16) rotate(14deg);
        }
      }

      @keyframes cartSuccess {
        0%, 58% {
          opacity: 0;
          transform: translateY(18px) scale(0.9);
        }
        70%, 88% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translateY(-10px) scale(0.96);
        }
      }

      @keyframes cartButtonCatch {
        0%, 28% { transform: translateY(0) rotate(0deg) scale(1); }
        46% { transform: translateY(-10px) rotate(-2deg) scale(1.08); }
        62% { transform: translateY(3px) rotate(1deg) scale(0.98); }
        76% { transform: translateY(-4px) rotate(0deg) scale(1.03); }
        100% { transform: translateY(0) rotate(0deg) scale(1); }
      }

      footer {
        color: var(--muted);
        padding-top: 10px;
      }

      @media (max-width: 900px) {
        .hero,
        .product-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .hero {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 560px) {
        main {
          padding: 32px 14px;
        }

        .product-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div>
          <p class="kicker">Vibe Mall campaign</p>
          <h1>${escapeHtml(campaignName)}</h1>
          <p class="why">This mall shelf exists because ${safeVibe} deserves a shoppable drop that feels curated, cinematic, and ready to share.</p>
        </div>
        <aside class="hero-badge">
          <strong>${products.length}</strong>
          <span>products assembled from the provided catalog snapshot</span>
        </aside>
      </section>
      <section class="product-grid" aria-label="Selected products">
        ${cards}
      </section>
      <section class="checkout">
        <div class="checkout-copy">
          <p class="kicker">Checkout</p>
          <h2>Ready to add the shelf to cart.</h2>
          <p>Complete the look with the selected products, current pricing, and campaign-ready product mix.</p>
        </div>
        <div id="cart-pop" class="cart-pop" aria-hidden="true">
          ${cartFlightItems}
          <span class="cart-success">Added to cart</span>
        </div>
        <div class="checkout-action">
          <a class="cart-cta" href="#cart-pop">Add curated shelf to cart</a>
        </div>
      </section>
      <footer>Generated by Codex for Vibe Mall</footer>
    </main>
  </body>
</html>`;
}

async function emitCodeChunks({
  code,
  onCodeDelta,
  startLength = 0
}: {
  code: string;
  onCodeDelta?: GenerateStorefrontInput["onCodeDelta"];
  startLength?: number;
}) {
  if (!onCodeDelta) {
    return;
  }

  const chunkSize = 220;
  const delayMs = 12;

  for (let index = 0; index < code.length; index += chunkSize) {
    const end = Math.min(index + chunkSize, code.length);

    onCodeDelta(code.slice(index, end), startLength + end);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

function summarizeTurn({
  finalResponse,
  items,
  usage
}: {
  finalResponse: string;
  items: ThreadItem[];
  usage: Usage | null;
}) {
  return JSON.stringify({
    finalResponseLength: finalResponse.length,
    itemTypes: items.map((item) => item.type),
    usage
  });
}

function codexEnv() {
  return {
    HOME: process.env.HOME ?? "",
    PATH: process.env.PATH ?? "",
    SHELL: process.env.SHELL ?? "",
    TMPDIR: process.env.TMPDIR ?? "/tmp"
  };
}

function codexModel() {
  return process.env.CODEX_MODEL?.trim() || undefined;
}

function codexReasoningEffort(): CodexRuntimeReasoningEffort {
  const value = process.env.CODEX_REASONING_EFFORT?.trim();

  return value && isCodexRuntimeReasoningEffort(value) ? value : "low";
}

function progressForCodexEvent(event: ThreadEvent) {
  switch (event.type) {
    case "thread.started":
      return "Codex SDK thread started.";
    case "turn.started":
      return "Codex SDK turn started.";
    case "item.started":
      if (event.item.type === "agent_message") {
        return "Codex started composing the storefront code.";
      }

      if (event.item.type === "reasoning") {
        return "Codex is planning the storefront structure.";
      }

      if (event.item.type === "command_execution") {
        return "Codex started a sandboxed command.";
      }

      return `Codex started ${event.item.type.replaceAll("_", " ")}.`;
    case "item.updated":
      if (event.item.type === "agent_message" && event.item.text.length > 0) {
        return `Codex has drafted ${event.item.text.length.toLocaleString()} characters of code.`;
      }

      return null;
    case "item.completed":
      if (event.item.type === "agent_message") {
        return `Codex finished the code response (${event.item.text.length.toLocaleString()} characters).`;
      }

      if (event.item.type === "command_execution") {
        return `Codex completed a sandboxed command with status ${event.item.status}.`;
      }

      return `Codex completed ${event.item.type.replaceAll("_", " ")}.`;
    case "turn.completed":
      return "Codex turn completed. Preparing the code for safety checks.";
    case "turn.failed":
      return `Codex turn failed: ${event.error.message}`;
    case "error":
      return `Codex stream error: ${event.message}`;
  }
}

export async function generateStorefrontHtmlWithCodex({
  onCodeDelta,
  onProgress,
  vibe,
  products
}: GenerateStorefrontInput): Promise<GenerateStorefrontResult> {
  if (process.env.CODEX_DEMO_MODE === "true") {
    const html = generateDemoHtml({ vibe, products });

    onProgress?.("Demo mode generated deterministic storefront code locally.");
    await emitCodeChunks({ code: html, onCodeDelta });

    return {
      html,
      rawSummary: JSON.stringify({
        mode: "demo",
        productCount: products.length
      })
    };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when CODEX_DEMO_MODE is not true.");
  }

  const { Codex } = await import("@openai/codex-sdk");
  const codex = new Codex({
    apiKey,
    env: codexEnv()
  });
  const thread = codex.startThread({
    approvalPolicy: "never",
    model: codexModel(),
    // The SDK type can lag the API; gpt-5.5 accepts "none".
    modelReasoningEffort: codexReasoningEffort() as ModelReasoningEffort,
    networkAccessEnabled: false,
    sandboxMode: "read-only",
    skipGitRepoCheck: true,
    webSearchEnabled: false,
    webSearchMode: "disabled",
    workingDirectory: process.cwd()
  });
  const prompt = buildCodexStorefrontPrompt({ vibe, products });
  const { events } = await thread.runStreamed(prompt);
  const items: ThreadItem[] = [];
  let finalResponse = "";
  let usage: Usage | null = null;
  let turnFailure: string | null = null;
  const startedAt = Date.now();
  let lastProgressMessage = "";
  let streamedCodeLength = 0;
  const heartbeat = setInterval(() => {
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

    onProgress?.(`Codex SDK is still running (${elapsedSeconds}s elapsed).`);
  }, 5000);

  try {
    for await (const event of events) {
      const message = progressForCodexEvent(event);

      if (message && message !== lastProgressMessage) {
        onProgress?.(message);
        lastProgressMessage = message;
      }

      if (event.type === "item.updated" && event.item.type === "agent_message") {
        const currentCode = event.item.text;

        if (currentCode.length > streamedCodeLength) {
          const delta = currentCode.slice(streamedCodeLength);
          const previousLength = streamedCodeLength;
          streamedCodeLength = currentCode.length;
          await emitCodeChunks({
            code: delta,
            onCodeDelta,
            startLength: previousLength
          });
        }
      }

      if (event.type === "item.completed") {
        if (event.item.type === "agent_message") {
          finalResponse = event.item.text;

          if (finalResponse.length > streamedCodeLength) {
            const delta = finalResponse.slice(streamedCodeLength);
            const previousLength = streamedCodeLength;
            streamedCodeLength = finalResponse.length;
            await emitCodeChunks({
              code: delta,
              onCodeDelta,
              startLength: previousLength
            });
          }
        }

        items.push(event.item);
      } else if (event.type === "turn.completed") {
        usage = event.usage;
      } else if (event.type === "turn.failed") {
        turnFailure = event.error.message;
        break;
      }
    }
  } finally {
    clearInterval(heartbeat);
  }

  if (turnFailure) {
    throw new Error(turnFailure);
  }

  return {
    html: finalResponse,
    codexThreadId: thread.id ?? undefined,
    rawSummary: summarizeTurn({ finalResponse, items, usage })
  };
}
