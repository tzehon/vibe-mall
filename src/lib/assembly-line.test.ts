import { describe, expect, it } from "vitest";

import { ASSEMBLY_LINE_STEPS } from "./assembly-line";

describe("ASSEMBLY_LINE_STEPS", () => {
  it("documents the four planned Trend Mall pipeline stages", () => {
    expect(ASSEMBLY_LINE_STEPS).toHaveLength(4);
    expect(ASSEMBLY_LINE_STEPS.map((step) => step.title)).toEqual([
      "Decide what you'd like to sell",
      "Codex SDK writes code",
      "Sandboxed storefront preview",
      "Public Mall URL"
    ]);
  });
});
