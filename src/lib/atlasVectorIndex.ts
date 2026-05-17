import { setTimeout } from "node:timers/promises";
import type { Collection, Db, Document, SearchIndexDescription } from "mongodb";

import {
  PRODUCT_AUTO_EMBEDDING_MODEL,
  PRODUCT_SEARCH_PATH,
  PRODUCT_VECTOR_INDEX_NAME
} from "./demoMetadata";

const INDEX_POLL_INTERVAL_MS = 5000;
const DEFAULT_INDEX_TIMEOUT_MS = 5 * 60 * 1000;

export const PRODUCT_AUTO_EMBED_INDEX: SearchIndexDescription = {
  name: PRODUCT_VECTOR_INDEX_NAME,
  type: "vectorSearch",
  definition: {
    fields: [
      {
        type: "autoEmbed",
        modality: "text",
        path: PRODUCT_SEARCH_PATH,
        model: PRODUCT_AUTO_EMBEDDING_MODEL
      },
      {
        type: "filter",
        path: "active"
      },
      {
        type: "filter",
        path: "category"
      }
    ]
  }
};

type SearchIndexState = {
  name?: string;
  queryable?: boolean;
  status?: string;
  latestDefinition?: Document;
  definition?: Document;
};

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getIndexTimeoutMs() {
  const rawValue = process.env.ATLAS_INDEX_TIMEOUT_MS?.trim();

  if (!rawValue) {
    return DEFAULT_INDEX_TIMEOUT_MS;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    console.warn(
      `Ignoring invalid ATLAS_INDEX_TIMEOUT_MS=${rawValue}; using ${DEFAULT_INDEX_TIMEOUT_MS}ms.`
    );
    return DEFAULT_INDEX_TIMEOUT_MS;
  }

  return parsedValue;
}

function formatSeconds(milliseconds: number) {
  return `${Math.round(milliseconds / 1000)}s`;
}

export function isAtlasAutoScalingError(error: unknown) {
  const message = getErrorMessage(error);

  return (
    /Compute Auto-Scale/i.test(message) ||
    (/auto-?scal/i.test(message) && /M30|maximum instance|cluster tier/i.test(message))
  );
}

export function printAtlasAutoScalingInstructions() {
  console.log("");
  console.log("Atlas Automated Embedding prerequisite:");
  console.log(
    "- The index JSON is valid, but Atlas rejected autoEmbed because compute auto-scaling is not configured high enough."
  );
  console.log(
    "- For dedicated M10/M20 clusters, enable cluster tier auto-scaling and set the maximum instance size to M30 or higher."
  );
  console.log(
    "- For dedicated M30+ clusters, enable cluster tier auto-scaling and set the maximum instance size higher than the current tier."
  );
  console.log("- Enable storage auto-scaling too.");
  console.log(
    "Manual Atlas UI index creation will hit the same prerequisite until these scaling settings are saved."
  );
  console.log("After updating the cluster settings, rerun: npm run create-index");
  console.log(
    "Reference: https://www.mongodb.com/docs/vector-search/crud-embeddings/automated-embedding/"
  );
}

export function printManualAtlasIndexInstructions(databaseName?: string) {
  const resolvedDatabaseName =
    databaseName?.trim() || process.env.MONGODB_DB?.trim() || "<MONGODB_DB>";

  console.log("");
  console.log("Manual Atlas UI instructions:");
  console.log("1. Open your Atlas cluster.");
  console.log("2. Go to Search & Vector Search, then create a Vector Search index.");
  console.log("3. Choose JSON Editor.");
  console.log(`4. Select database ${resolvedDatabaseName} and collection products.`);
  console.log(`5. Set index name to ${PRODUCT_VECTOR_INDEX_NAME}.`);
  console.log("6. Paste this Vector Search index definition:");
  console.log("");
  console.log(JSON.stringify(PRODUCT_AUTO_EMBED_INDEX.definition, null, 2));
  console.log("");
  console.log("Driver/CLI descriptor used by this script:");
  console.log("");
  console.log(JSON.stringify(PRODUCT_AUTO_EMBED_INDEX, null, 2));
  console.log("");
  console.log("Atlas must have Automated Embedding / Voyage model access enabled.");
}

export function printProductVectorSearchIndexFailure(error: unknown, databaseName?: string) {
  console.error("");
  console.error("Could not create the Atlas Vector Search index through the MongoDB driver.");
  console.error(getErrorMessage(error));

  if (isAtlasAutoScalingError(error)) {
    printAtlasAutoScalingInstructions();
    return;
  }

  console.error(
    "This can happen if the driver path, permissions, MongoDB version, or Atlas Search index capability is unavailable."
  );
  printManualAtlasIndexInstructions(databaseName);
}

async function getSearchIndex(
  collection: Collection,
  indexName: string
): Promise<SearchIndexState | null> {
  const [indexData] = (await collection.listSearchIndexes(indexName).toArray()) as SearchIndexState[];

  return indexData ?? null;
}

async function waitForSearchIndexQueryable(collection: Collection, indexName: string) {
  const timeoutMs = getIndexTimeoutMs();
  const deadline = Date.now() + timeoutMs;

  console.log("");
  console.log(
    `Polling ${indexName} until it is queryable. Timeout: ${formatSeconds(timeoutMs)}.`
  );

  while (Date.now() < deadline) {
    const indexData = await getSearchIndex(collection, indexName);

    if (!indexData) {
      console.log(`Index ${indexName} is not visible yet. Waiting...`);
      await setTimeout(INDEX_POLL_INTERVAL_MS);
      continue;
    }

    if (indexData.queryable === true) {
      console.log(`${indexName} is ready for querying.`);
      return indexData;
    }

    const status = indexData.status ? ` status=${indexData.status}` : "";
    console.log(`Index ${indexName} is building.${status} Waiting...`);
    await setTimeout(INDEX_POLL_INTERVAL_MS);
  }

  throw new Error(
    `Timed out after ${formatSeconds(timeoutMs)} waiting for ${indexName} to become queryable.`
  );
}

export async function createOrVerifyProductVectorSearchIndex(db: Db) {
  const collection = db.collection("products");
  const existingIndexes = await collection
    .listSearchIndexes(PRODUCT_VECTOR_INDEX_NAME)
    .toArray();

  if (existingIndexes.length > 0) {
    console.log("");
    console.log(`Search index ${PRODUCT_VECTOR_INDEX_NAME} already exists.`);
    console.log(
      "If you need to change it, update the index in Atlas UI or drop and recreate it intentionally."
    );
    await waitForSearchIndexQueryable(collection, PRODUCT_VECTOR_INDEX_NAME);
    return;
  }

  const createdName = await collection.createSearchIndex(PRODUCT_AUTO_EMBED_INDEX);
  console.log("");
  console.log(`New Atlas Vector Search index named ${createdName} is building.`);
  console.log(
    "Atlas will asynchronously generate embeddings for products.searchText using voyage-4."
  );
  await waitForSearchIndexQueryable(collection, createdName);
}
