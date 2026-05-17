import { describe, expect, it } from "vitest";

import { buildCodexStorefrontPrompt } from "./prompt";
import type { ProductSearchResult } from "@/lib/productSearch";

const product: ProductSearchResult = {
  _id: "507f1f77bcf86cd799439011",
  sku: "VM-001",
  name: "Cloud Pop Birthday Hoodie",
  brand: "Vibe Mall",
  category: "apparel",
  price: 42,
  palette: ["#ffccdd", "#3157a4"],
  imageDataUri: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
  tags: ["birthday", "cute", "party", "gift", "soft"],
  searchText: "cute birthday apparel hoodie",
  vectorSearchScore: 0.92
};

describe("buildCodexStorefrontPrompt", () => {
  it("constrains Codex to one vibe-matched layout archetype", () => {
    const prompt = buildCodexStorefrontPrompt({
      vibe: "Pokemon style cute birthday",
      products: [product]
    });

    expect(prompt).toContain("Pick exactly one layout archetype based on the vibe");
    expect(prompt).toContain("magazine spread");
    expect(prompt).toContain("toy catalog");
    expect(prompt).toContain("luxury drop");
    expect(prompt).toContain("arcade shelf");
    expect(prompt).toContain("birthday party table");
    expect(prompt).toContain("streetwear launch");
    expect(prompt).toContain("Do not mention the archetype name in user-facing copy");
  });

  it("prevents checkout CTA animation from overlapping copy", () => {
    const prompt = buildCodexStorefrontPrompt({
      vibe: "Pokemon style cute birthday",
      products: [product]
    });

    expect(prompt).toContain("Reserve enough vertical space");
    expect(prompt).toContain("never overlap the headline or body copy");
  });
});
