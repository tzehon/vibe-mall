export const PRODUCT_VECTOR_INDEX_NAME = "product_vibe_autoembed";
export const PRODUCT_SEARCH_PATH = "searchText";
export const PRODUCT_AUTO_EMBEDDING_MODEL = "voyage-4";

export const DEMO_SAMPLE_VIBES = [
  "Pokemon style cute birthday",
  "No wires clean desk refresh",
  "Quiet luxury winterwear",
  "neon rainy-night gamer dorm",
  "soft-launch founder coffee run"
] as const;

export const GENERATION_TIMELINE_STEPS = [
  {
    idle: "Search the database for the vibe space",
    active: "Database searching the vibe space",
    complete: "Database searched the vibe space"
  },
  {
    idle: "Match products through semantic search",
    active: "Matching products through semantic search",
    complete: "Products matched through semantic search"
  },
  {
    idle: "Write the storefront code with Codex",
    active: "Codex writing the storefront code",
    complete: "Codex wrote the storefront code"
  },
  {
    idle: "Run code safety checks",
    active: "Checking generated code for safety",
    complete: "Code safety checks passed"
  },
  {
    idle: "Save the draft to database",
    active: "Saving the draft to database",
    complete: "Draft saved to database"
  },
  {
    idle: "Prepare publishing controls",
    active: "Preparing publishing controls",
    complete: "Ready to publish"
  }
] as const;

export type GenerationErrorCode =
  | "auth_required"
  | "invalid_request"
  | "no_products"
  | "atlas_unavailable"
  | "codex_failed"
  | "html_safety_failed"
  | "mongodb_unavailable"
  | "unknown";

export type TechnicalMetadataInput = {
  vibe: string;
  productCount: number | null;
  fallbackUsed: boolean | null;
  htmlSafety: "not-run" | "running" | "passed" | "failed";
};

export function formatFallbackMode(value: boolean | null) {
  if (value === null) {
    return "Pending";
  }

  return value ? "Yes - deterministic demo fallback" : "No - Atlas auto-embedding";
}

export function formatProductCount(value: number | null) {
  if (value === null) {
    return "Pending";
  }

  return `${value} product${value === 1 ? "" : "s"}`;
}

export function formatHtmlSafety(value: TechnicalMetadataInput["htmlSafety"]) {
  switch (value) {
    case "passed":
      return "Passed";
    case "failed":
      return "Failed";
    case "running":
      return "Running";
    case "not-run":
      return "Not run";
  }
}

export function buildTechnicalMetadata(input: TechnicalMetadataInput) {
  return [
    {
      label: "Vibe text",
      value: input.vibe.trim() || "Waiting for a vibe"
    },
    {
      label: "Atlas index name",
      value: PRODUCT_VECTOR_INDEX_NAME
    },
    {
      label: "Embedding model",
      value: `${PRODUCT_AUTO_EMBEDDING_MODEL} via autoEmbed`
    },
    {
      label: "Search method",
      value: "$vectorSearch"
    },
    {
      label: "Products retrieved",
      value: formatProductCount(input.productCount)
    },
    {
      label: "Fallback demo mode",
      value: formatFallbackMode(input.fallbackUsed)
    },
    {
      label: "Codex SDK",
      value: "Server-side generation"
    },
    {
      label: "Code safety validation",
      value: formatHtmlSafety(input.htmlSafety)
    },
    {
      label: "iframe sandbox",
      value: "Enabled"
    },
    {
      label: "Persistence",
      value: "MongoDB"
    }
  ];
}

export function getGenerationErrorCopy(
  errorCode: GenerationErrorCode | undefined,
  fallbackMessage: string
) {
  switch (errorCode) {
    case "auth_required":
      return {
        title: "Login required",
        description: "The generation route needs a signed merchant session before it can save a draft.",
        recovery: "Log in with the demo merchant account, then return to Create."
      };
    case "no_products":
      return {
        title: "No products matched",
        description:
          "Atlas finished the search but did not return usable products for this vibe.",
        recovery: "Try a more concrete mood, occasion, category, or style cue."
      };
    case "atlas_unavailable":
      return {
        title: "Atlas search is unavailable",
        description:
          "The product search step could not reach the Atlas Vector Search index or the index is not ready.",
        recovery:
          "Confirm the product_vibe_autoembed index exists with voyage-4 autoEmbed, then try again."
      };
    case "codex_failed":
      return {
        title: "Codex generation failed",
        description:
          "Products were retrieved, but the server-side Codex SDK call did not return usable code.",
        recovery: "Check OPENAI_API_KEY or set CODEX_DEMO_MODE=true for a deterministic demo run."
      };
    case "html_safety_failed":
      return {
        title: "Code safety checks failed",
        description:
          "Codex returned code that did not satisfy the sandbox rules or omitted selected product data.",
        recovery: "Retry the same vibe or make it more specific so Codex can produce a compliant storefront."
      };
    case "mongodb_unavailable":
      return {
        title: "MongoDB is unavailable",
        description:
          "The app could not read or write the MongoDB Atlas records needed for this step.",
        recovery: "Confirm MONGODB_URI and MONGODB_DB are configured, then rerun the action."
      };
    case "invalid_request":
      return {
        title: "Vibe needs a little more detail",
        description: fallbackMessage,
        recovery: "Use a short phrase with a mood, occasion, or shopping intent."
      };
    case "unknown":
    case undefined:
      return {
        title: "Generation stopped",
        description: fallbackMessage,
        recovery: "Try again. If it repeats, check server logs for the failing stage."
      };
  }
}
