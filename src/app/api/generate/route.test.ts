import { afterEach, describe, expect, it, vi } from "vitest";

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
  tags: ["birthday", "cute"],
  searchText: "cute birthday apparel hoodie",
  vectorSearchScore: 0.92
};

describe("POST /api/generate", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.doUnmock("@/lib/auth");
    vi.doUnmock("@/lib/codex/generateStorefrontHtml");
    vi.doUnmock("@/lib/mongodb");
    vi.doUnmock("@/lib/productSearch");
    vi.doUnmock("@openai/codex-sdk");
  });

  it("does not load the real Codex SDK in CODEX_DEMO_MODE", async () => {
    vi.stubEnv("CODEX_DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

    const inserted: unknown[] = [];

    vi.doMock("@/lib/auth", () => ({
      getCurrentUserFromRequest: async () => ({
        _id: "507f1f77bcf86cd799439010",
        email: "demo@vibemall.local",
        name: "Demo Merchant"
      })
    }));
    vi.doMock("@/lib/productSearch", () => ({
      searchProductsByVibe: async () => ({
        results: [product],
        metadata: {
          mode: "demo-fallback",
          usedFallback: true,
          indexName: "product_vibe_autoembed",
          path: "searchText",
          model: "voyage-4",
          reason: "unit test fallback"
        }
      })
    }));
    vi.doMock("@/lib/mongodb", () => ({
      getDb: async () => ({
        collection: () => ({
          insertOne: async (document: unknown) => {
            inserted.push(document);
            return { acknowledged: true };
          }
        })
      })
    }));
    vi.doMock("@openai/codex-sdk", () => {
      throw new Error("The real Codex SDK should not be imported in demo mode.");
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ vibe: "Pokemon style cute birthday" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("draft");
    expect(body.products).toHaveLength(1);
    expect(body.previewUrl).toContain("/storefronts/");
    expect(inserted).toHaveLength(1);
  });

  it("validates generated HTML before saving a draft", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    const getDb = vi.fn(async () => ({
      collection: () => ({
        insertOne: vi.fn()
      })
    }));

    vi.doMock("@/lib/auth", () => ({
      getCurrentUserFromRequest: async () => ({
        _id: "507f1f77bcf86cd799439010",
        email: "demo@vibemall.local",
        name: "Demo Merchant"
      })
    }));
    vi.doMock("@/lib/productSearch", () => ({
      searchProductsByVibe: async () => ({
        results: [product],
        metadata: {
          mode: "atlas-auto-embedding",
          usedFallback: false,
          indexName: "product_vibe_autoembed",
          path: "searchText",
          model: "voyage-4"
        }
      })
    }));
    vi.doMock("@/lib/codex/generateStorefrontHtml", () => ({
      generateStorefrontHtmlWithCodex: async () => ({
        html: "<!doctype html><html><body><script>alert(1)</script></body></html>",
        rawSummary: "{}"
      })
    }));
    vi.doMock("@/lib/mongodb", () => ({
      getDb
    }));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ vibe: "Pokemon style cute birthday" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toEqual({
      error: "Generated HTML cannot include script tags.",
      errorCode: "html_safety_failed"
    });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("streams real generation progress events when requested", async () => {
    vi.stubEnv("CODEX_DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

    vi.doMock("@/lib/auth", () => ({
      getCurrentUserFromRequest: async () => ({
        _id: "507f1f77bcf86cd799439010",
        email: "demo@vibemall.local",
        name: "Demo Merchant"
      })
    }));
    vi.doMock("@/lib/productSearch", () => ({
      searchProductsByVibe: async () => ({
        results: [product],
        metadata: {
          mode: "atlas-auto-embedding",
          usedFallback: false,
          indexName: "product_vibe_autoembed",
          path: "searchText",
          model: "voyage-4",
          reason: "unit test fallback"
        }
      })
    }));
    vi.doMock("@/lib/mongodb", () => ({
      getDb: async () => ({
        collection: () => ({
          insertOne: async () => ({ acknowledged: true })
        })
      })
    }));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: {
          accept: "text/event-stream",
          "content-type": "application/json"
        },
        body: JSON.stringify({ vibe: "Pokemon style cute birthday" })
      })
    );
    const streamText = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(streamText).toContain("event: progress");
    expect(streamText).toContain("event: code");
    expect(streamText.match(/event: code/g)?.length ?? 0).toBeGreaterThan(1);
    expect(streamText).toContain("<!doctype html>");
    expect(streamText).toContain("Cloud Pop Birthday Hoodie");
    expect(streamText).toContain("Searching the catalog");
    expect(streamText).toContain("database semantic search");
    expect(streamText).toContain("event: done");
    expect(streamText).toContain('"status":"draft"');
  });
});
