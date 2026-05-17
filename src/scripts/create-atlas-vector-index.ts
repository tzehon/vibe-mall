import nextEnv from "@next/env";

import {
  createOrVerifyProductVectorSearchIndex,
  getErrorMessage,
  printManualAtlasIndexInstructions,
  printProductVectorSearchIndexFailure,
  PRODUCT_AUTO_EMBED_INDEX
} from "../lib/atlasVectorIndex";
import { getMongoClient } from "../lib/mongodb";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function hasMongoEnv() {
  return Boolean(process.env.MONGODB_URI?.trim() && process.env.MONGODB_DB?.trim());
}

async function main() {
  console.log("Atlas Vector Search index target:");
  console.log(JSON.stringify(PRODUCT_AUTO_EMBED_INDEX, null, 2));

  if (!hasMongoEnv()) {
    console.log("");
    console.log(
      "MONGODB_URI or MONGODB_DB is missing, so the driver did not attempt index creation."
    );
    printManualAtlasIndexInstructions();
    return;
  }

  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB?.trim();
  const db = client.db(dbName);

  try {
    await createOrVerifyProductVectorSearchIndex(db);
  } catch (error: unknown) {
    printProductVectorSearchIndexFailure(error, dbName);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error("Atlas vector index setup failed.");
  console.error(getErrorMessage(error));
  printManualAtlasIndexInstructions();
  process.exitCode = 1;
});
