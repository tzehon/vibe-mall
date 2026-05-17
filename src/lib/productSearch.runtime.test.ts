import { ObjectId } from "mongodb";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PRODUCT_AUTO_EMBEDDING_MODEL,
  PRODUCT_SEARCH_PATH,
  PRODUCT_VECTOR_INDEX_NAME
} from "./demoMetadata";

describe("searchProductsByVibe runtime behavior", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.doUnmock("./mongodb");
    vi.doUnmock("@/lib/mongodb");
  });

  it("returns normalized Atlas results", async () => {
    const productId = new ObjectId("507f1f77bcf86cd799439011");
    const aggregate = vi.fn(() => ({
      toArray: async () => [
        {
          _id: productId,
          sku: "VM-001",
          name: "Cloud Pop Birthday Hoodie",
          brand: "Vibe Mall",
          category: "apparel",
          price: 42,
          palette: ["#ffccdd"],
          imageDataUri: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
          tags: ["birthday", "cute"],
          searchText: "cute birthday apparel hoodie",
          active: true,
          createdAt: new Date("2026-05-16T00:00:00.000Z"),
          vectorSearchScore: 0.92
        }
      ]
    }));

    vi.stubEnv("CODEX_DEMO_MODE", "false");
    vi.doMock("./mongodb", () => ({
      getDb: async () => ({
        collection: () => ({
          aggregate
        })
      })
    }));

    const { searchProductsByVibe } = await import("./productSearch");
    const response = await searchProductsByVibe("cute birthday", 1);

    expect(aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $vectorSearch: expect.objectContaining({
            index: PRODUCT_VECTOR_INDEX_NAME,
            path: PRODUCT_SEARCH_PATH,
            query: { text: "cute birthday" },
            filter: { active: true }
          })
        })
      ])
    );
    expect(response.metadata).toEqual({
      mode: "atlas-auto-embedding",
      usedFallback: false,
      indexName: PRODUCT_VECTOR_INDEX_NAME,
      path: PRODUCT_SEARCH_PATH,
      model: PRODUCT_AUTO_EMBEDDING_MODEL
    });
    expect(response.results).toEqual([
      {
        _id: productId.toHexString(),
        sku: "VM-001",
        name: "Cloud Pop Birthday Hoodie",
        brand: "Vibe Mall",
        category: "apparel",
        price: 42,
        palette: ["#ffccdd"],
        imageDataUri: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
        tags: ["birthday", "cute"],
        searchText: "cute birthday apparel hoodie",
        vectorSearchScore: 0.92
      }
    ]);
  });

  it("clearly labels deterministic fallback mode", async () => {
    const productId = new ObjectId("507f1f77bcf86cd799439012");

    vi.stubEnv("CODEX_DEMO_MODE", "true");
    vi.doMock("./mongodb", () => ({
      getDb: async () => ({
        collection: () => ({
          find: () => ({
            limit: () => ({
              toArray: async () => [
                {
                  _id: productId,
                  sku: "VM-002",
                  name: "Neon Desk Cable Tray",
                  brand: "Vibe Mall",
                  category: "gadgets",
                  price: 24.5,
                  palette: ["#3157a4"],
                  imageDataUri: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
                  tags: ["desk", "clean"],
                  searchText: "clean desk no wires cable management gadget",
                  active: true,
                  createdAt: new Date("2026-05-16T00:00:00.000Z")
                }
              ]
            })
          })
        })
      })
    }));

    const { searchProductsByVibe } = await import("./productSearch");
    const response = await searchProductsByVibe("No wires clean desk refresh", 8);

    expect(response.metadata.mode).toBe("demo-fallback");
    expect(response.metadata.usedFallback).toBe(true);
    expect(response.metadata.reason).toContain("CODEX_DEMO_MODE=true");
    expect(response.results).toHaveLength(1);
    expect(response.results[0]).toMatchObject({
      _id: productId.toHexString(),
      name: "Neon Desk Cable Tray",
      vectorSearchScore: expect.any(Number)
    });
  });
});
