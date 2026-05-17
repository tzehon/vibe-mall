import { describe, expect, it } from "vitest";

import { DEMO_SAMPLE_TRENDS } from "./demoMetadata";
import { buildSeedProducts, DEMO_USERS, seedDataFingerprint } from "./seed-data";

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

describe("buildSeedProducts", () => {
  it("defines two seeded demo merchants for access-control demos", () => {
    expect(DEMO_USERS).toHaveLength(2);
    expect(new Set(DEMO_USERS.map((user) => user.email)).size).toBe(2);
    expect(new Set(DEMO_USERS.map((user) => user.password)).size).toBe(2);
  });

  it("creates 420 products across the required categories by default", () => {
    const products = buildSeedProducts();
    const categories = new Set(products.map((product) => product.category));

    expect(products).toHaveLength(420);
    expect(categories).toEqual(
      new Set(["apparel", "accessories", "home", "beauty", "gadgets", "snacks", "gifting"])
    );
  });

  it("creates unique SKUs and inline SVG images", () => {
    const products = buildSeedProducts();
    const skus = new Set(products.map((product) => product.sku));
    const decodedFirstSvg = decodeURIComponent(products[0].imageDataUri.split(",", 2)[1] ?? "");

    expect(skus.size).toBe(products.length);
    expect(products.every((product) => product.imageDataUri.startsWith("data:image/svg+xml"))).toBe(
      true
    );
    expect(decodedFirstSvg).toContain('id="item-');
    expect(decodedFirstSvg).toContain('id="popShadow"');
  });

  it("renders representative products with noun-specific SVG artwork", () => {
    const products = buildSeedProducts();
    const cases = [
      ["Boxy Tee", 'id="item-apparel-boxy-tee"'],
      ["Travel Hoodie", 'id="item-apparel-hoodie"'],
      ["Mini Tote", 'id="item-accessories-mini-tote"'],
      ["Beaded Charm Set", 'id="item-accessories-charm-set"'],
      ["Ceramic Tray", 'id="item-home-ceramic-tray"'],
      ["Ambient Diffuser", 'id="item-home-ambient-diffuser"'],
      ["Lip Tint", 'id="item-beauty-lip-tint"'],
      ["Sheet Mask Stack", 'id="item-beauty-sheet-mask-stack"'],
      ["LED Key Light", 'id="item-gadgets-led-key-light"'],
      ["Travel Adapter", 'id="item-gadgets-travel-adapter"'],
      ["Mochi Snack Box", 'id="item-snacks-mochi-box"'],
      ["Matcha Cookie Tin", 'id="item-snacks-cookie-tin"'],
      ["Desk Mascot Kit", 'id="item-gifting-desk-mascot"'],
      ["Birthday Bundle", 'id="item-gifting-birthday-bundle"']
    ] as const;

    for (const [namePart, expectedSvgId] of cases) {
      const product = products.find((candidate) => candidate.name.includes(namePart));
      const decodedSvg = decodeURIComponent(product?.imageDataUri.split(",", 2)[1] ?? "");

      expect(product?.name).toContain(namePart);
      expect(decodedSvg).toContain(expectedSvgId);
    }
  });

  it("escapes XML text inside SVG data URIs", () => {
    const bowAndBloomProduct = buildSeedProducts().find((product) => product.brand === "Bow & Bloom");
    const encodedSvg = bowAndBloomProduct?.imageDataUri.split(",", 2)[1] ?? "";
    const decodedSvg = decodeURIComponent(encodedSvg);

    expect(decodedSvg).toContain("Bow &amp; Bloom");
    expect(decodedSvg).not.toContain("Bow & Bloom gifting");
  });

  it("creates rich searchText for semantic retrieval", () => {
    const [product] = buildSeedProducts(1);

    expect(product.searchText).toContain("Mood:");
    expect(product.searchText).toContain("Style:");
    expect(product.searchText).toContain("Occasion:");
    expect(product.searchText).toContain("Materials and finish:");
    expect(product.searchText).toContain("Customer intent:");
    expect(product.searchText).toContain("Social trend:");
  });

  it("aligns seeded products with every suggested sample trend chip", () => {
    const products = buildSeedProducts();

    for (const trend of DEMO_SAMPLE_TRENDS) {
      const matches = products.filter((product) =>
        product.searchText.includes(`Suggested chip match: ${trend}`)
      );
      const trendTokens = normalizeSearchText(trend)
        .split(" ")
        .filter((token) => token.length > 3);
      const visibleMatches = matches.filter((product) => {
        const visibleProductText = normalizeSearchText(`${product.name} ${product.tags.join(" ")}`);

        return trendTokens.some((token) => visibleProductText.includes(token));
      });

      expect(matches.length).toBeGreaterThanOrEqual(20);
      expect(visibleMatches.length).toBeGreaterThanOrEqual(20);
    }
  });

  it("is deterministic", () => {
    expect(seedDataFingerprint(buildSeedProducts())).toBe(
      seedDataFingerprint(buildSeedProducts())
    );
  });
});
