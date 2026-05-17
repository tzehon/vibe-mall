import { describe, expect, it } from "vitest";

import {
  buildTechnicalMetadata,
  GENERATION_TIMELINE_STEPS,
  getGenerationErrorCopy,
  PRODUCT_AUTO_EMBEDDING_MODEL,
  PRODUCT_VECTOR_INDEX_NAME
} from "./demoMetadata";

describe("GENERATION_TIMELINE_STEPS", () => {
  it("has grammatically distinct idle, active, and completed labels", () => {
    expect(GENERATION_TIMELINE_STEPS[2]).toEqual({
      idle: "Write the storefront code with Codex",
      active: "Codex writing the storefront code",
      complete: "Codex wrote the storefront code"
    });
    expect(GENERATION_TIMELINE_STEPS[4].active).toBe("Saving the draft to database");
    expect(GENERATION_TIMELINE_STEPS[4].complete).toBe("Draft saved to database");
  });
});

describe("buildTechnicalMetadata", () => {
  it("formats the demo technical metadata consistently", () => {
    const metadata = buildTechnicalMetadata({
      vibe: "Pokemon style cute birthday",
      productCount: 8,
      fallbackUsed: false,
      htmlSafety: "passed"
    });

    expect(metadata).toContainEqual({
      label: "Atlas index name",
      value: PRODUCT_VECTOR_INDEX_NAME
    });
    expect(metadata).toContainEqual({
      label: "Embedding model",
      value: `${PRODUCT_AUTO_EMBEDDING_MODEL} via autoEmbed`
    });
    expect(metadata).toContainEqual({
      label: "Products retrieved",
      value: "8 products"
    });
    expect(metadata).toContainEqual({
      label: "Code safety validation",
      value: "Passed"
    });
  });
});

describe("getGenerationErrorCopy", () => {
  it("gives a recovery step for Atlas index failures", () => {
    const copy = getGenerationErrorCopy("atlas_unavailable", "Search failed.");

    expect(copy.title).toBe("Atlas search is unavailable");
    expect(copy.recovery).toContain("product_vibe_autoembed");
  });
});
