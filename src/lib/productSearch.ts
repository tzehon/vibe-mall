import type { Document } from "mongodb";

import {
  PRODUCT_AUTO_EMBEDDING_MODEL,
  PRODUCT_SEARCH_PATH,
  PRODUCT_VECTOR_INDEX_NAME
} from "./demoMetadata";
import { getDb } from "./mongodb";
import type { Product, ProductCategory } from "./models";

export { PRODUCT_AUTO_EMBEDDING_MODEL, PRODUCT_SEARCH_PATH, PRODUCT_VECTOR_INDEX_NAME };

export type ProductSearchMode = "atlas-auto-embedding" | "demo-fallback";

export type ProductSearchResult = {
  _id: string;
  sku: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  palette: string[];
  imageDataUri: string;
  tags: string[];
  searchText: string;
  vectorSearchScore: number | null;
};

export type ProductSearchResponse = {
  results: ProductSearchResult[];
  metadata: {
    mode: ProductSearchMode;
    usedFallback: boolean;
    indexName: typeof PRODUCT_VECTOR_INDEX_NAME;
    path: typeof PRODUCT_SEARCH_PATH;
    model: typeof PRODUCT_AUTO_EMBEDDING_MODEL;
    reason?: string;
  };
};

function normalizeLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return 8;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 24);
}

function normalizeTrend(trend: string) {
  const normalized = trend.trim();

  if (!normalized) {
    throw new Error("A trend is required to search products.");
  }

  return normalized;
}

export function buildProductVectorSearchPipeline(trend: string, limit = 8): Document[] {
  const normalizedTrend = normalizeTrend(trend);
  const normalizedLimit = normalizeLimit(limit);

  return [
    {
      $vectorSearch: {
        index: PRODUCT_VECTOR_INDEX_NAME,
        path: PRODUCT_SEARCH_PATH,
        query: {
          text: normalizedTrend
        },
        model: PRODUCT_AUTO_EMBEDDING_MODEL,
        filter: {
          active: true
        },
        numCandidates: Math.max(normalizedLimit * 20, 100),
        limit: normalizedLimit
      }
    },
    {
      $project: {
        sku: 1,
        name: 1,
        brand: 1,
        category: 1,
        price: 1,
        palette: 1,
        imageDataUri: 1,
        tags: 1,
        searchText: 1,
        active: 1,
        createdAt: 1,
        vectorSearchScore: {
          $meta: "vectorSearchScore"
        }
      }
    }
  ];
}

function tokenize(value: string) {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 2)
    )
  );
}

function normalizeProduct(product: Product & { vectorSearchScore?: number }): ProductSearchResult {
  return {
    _id: product._id.toHexString(),
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    palette: product.palette,
    imageDataUri: product.imageDataUri,
    tags: product.tags,
    searchText: product.searchText,
    vectorSearchScore:
      typeof product.vectorSearchScore === "number" ? product.vectorSearchScore : null
  };
}

function scoreFallbackProduct(product: Product, tokens: string[]) {
  const haystack = `${product.name} ${product.brand} ${product.category} ${product.tags.join(
    " "
  )} ${product.searchText}`.toLowerCase();

  return tokens.reduce((score, token) => (haystack.includes(token) ? score + 1 : score), 0);
}

async function fallbackTextSearch(trend: string, limit: number): Promise<ProductSearchResponse> {
  const db = await getDb();
  const normalizedLimit = normalizeLimit(limit);
  const tokens = tokenize(trend);
  const products = await db
    .collection<Product>("products")
    .find({ active: true })
    .limit(250)
    .toArray();

  const results = products
    .map((product) => ({
      product,
      score: scoreFallbackProduct(product, tokens)
    }))
    .filter((result) => result.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.product.sku.localeCompare(right.product.sku);
    })
    .slice(0, normalizedLimit)
    .map((result) =>
      normalizeProduct({
        ...result.product,
        vectorSearchScore: result.score
      })
    );

  return {
    results,
    metadata: {
      mode: "demo-fallback",
      usedFallback: true,
      indexName: PRODUCT_VECTOR_INDEX_NAME,
      path: PRODUCT_SEARCH_PATH,
      model: PRODUCT_AUTO_EMBEDDING_MODEL,
      reason:
        "CODEX_DEMO_MODE=true, so this used deterministic MongoDB text/tag scoring instead of Atlas Vector Search."
    }
  };
}

export async function searchProductsByTrend(
  trend: string,
  limit = 8
): Promise<ProductSearchResponse> {
  const normalizedTrend = normalizeTrend(trend);
  const normalizedLimit = normalizeLimit(limit);

  if (process.env.CODEX_DEMO_MODE === "true") {
    return fallbackTextSearch(normalizedTrend, normalizedLimit);
  }

  const db = await getDb();
  const pipeline = buildProductVectorSearchPipeline(normalizedTrend, normalizedLimit);
  const products = await db.collection<Product>("products").aggregate<Product>(pipeline).toArray();

  return {
    results: products.map(normalizeProduct),
    metadata: {
      mode: "atlas-auto-embedding",
      usedFallback: false,
      indexName: PRODUCT_VECTOR_INDEX_NAME,
      path: PRODUCT_SEARCH_PATH,
      model: PRODUCT_AUTO_EMBEDDING_MODEL
    }
  };
}
