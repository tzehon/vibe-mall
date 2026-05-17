import { afterEach, describe, expect, it, vi } from "vitest";

import { generateStorefrontHtmlWithCodex } from "./generateStorefrontHtml";
import type { ProductSearchResult } from "@/lib/productSearch";

const products: ProductSearchResult[] = [
  {
    _id: "507f1f77bcf86cd799439011",
    sku: "VM-001",
    name: "Cloud Pop Birthday Hoodie",
    brand: "Vibe Mall",
    category: "apparel",
    price: 42,
    palette: ["#ffccdd", "#3157a4"],
    imageDataUri: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
    tags: ["birthday", "cute"],
    searchText: "cute birthday apparel hoodie",
    vectorSearchScore: 0.92
  },
  {
    _id: "507f1f77bcf86cd799439012",
    sku: "VM-002",
    name: "Party Sparkle Snack Tin",
    brand: "Vibe Mall",
    category: "snacks",
    price: 18.5,
    palette: ["#b7d94f", "#e0523f"],
    imageDataUri: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
    tags: ["party", "gifting"],
    searchText: "birthday party snack gifting",
    vectorSearchScore: 0.84
  }
];

describe("generateStorefrontHtmlWithCodex", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the deterministic demo generator and includes all products", async () => {
    vi.stubEnv("CODEX_DEMO_MODE", "true");
    vi.stubEnv("OPENAI_API_KEY", "");
    const streamedChunks: string[] = [];

    const result = await generateStorefrontHtmlWithCodex({
      onCodeDelta: (delta) => streamedChunks.push(delta),
      vibe: "Pokemon style cute birthday",
      products
    });

    expect(result.codexThreadId).toBeUndefined();
    expect(result.html.startsWith("<!doctype html>")).toBe(true);

    for (const product of products) {
      expect(result.html).toContain(product.name);
      expect(result.html).toContain(`$${product.price.toFixed(2)}`);
      expect(result.html).toContain(product.imageDataUri);
    }

    expect(result.html).toContain("Add curated shelf to cart");
    expect(result.html).toContain("checkout-copy");
    expect(result.html).toContain("checkout-action");
    expect(result.html).toContain("cart-item");
    expect(result.html).toContain("itemIntoCart");
    expect(result.html).not.toContain("fake checkout");
    expect(result.html).not.toContain("intentionally non-transactional");
    expect(result.rawSummary).toContain('"mode":"demo"');
    expect(streamedChunks.length).toBeGreaterThan(1);
    expect(streamedChunks.join("")).toBe(result.html);
  });
});
