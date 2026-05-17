import { describe, expect, it } from "vitest";

import {
  buildProductVectorSearchPipeline,
  PRODUCT_AUTO_EMBEDDING_MODEL,
  PRODUCT_SEARCH_PATH,
  PRODUCT_VECTOR_INDEX_NAME
} from "./productSearch";

describe("buildProductVectorSearchPipeline", () => {
  it("uses Atlas Vector Search with auto-embedding text query shape", () => {
    const pipeline = buildProductVectorSearchPipeline("Y2K cyber-glam birthday", 8);
    const vectorStage = pipeline[0].$vectorSearch;

    expect(vectorStage.index).toBe(PRODUCT_VECTOR_INDEX_NAME);
    expect(vectorStage.path).toBe(PRODUCT_SEARCH_PATH);
    expect(vectorStage.query).toEqual({ text: "Y2K cyber-glam birthday" });
    expect(vectorStage.model).toBe(PRODUCT_AUTO_EMBEDDING_MODEL);
    expect(vectorStage.filter).toEqual({ active: true });
    expect(vectorStage.limit).toBe(8);
  });

  it("does not use queryVector anywhere in the pipeline", () => {
    const pipeline = buildProductVectorSearchPipeline("cozy desk refresh", 5);

    expect(JSON.stringify(pipeline)).not.toContain("queryVector");
  });

  it("projects vectorSearchScore metadata", () => {
    const pipeline = buildProductVectorSearchPipeline("quiet luxury airport sprint", 6);
    const projectStage = pipeline[1].$project;

    expect(projectStage.vectorSearchScore).toEqual({
      $meta: "vectorSearchScore"
    });
  });
});
