import nextEnv from "@next/env";
import type { Db } from "mongodb";

import { getMongoClient } from "../lib/mongodb";
import { PRODUCT_VECTOR_INDEX_NAME } from "../lib/productSearch";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const CONFIRM_TOKEN = "reset-vibe-mall";
const APP_COLLECTIONS = ["storefronts", "products", "users", "sessions"] as const;
const PROTECTED_DATABASES = new Set(["admin", "config", "local"]);

function hasMongoEnv() {
  return Boolean(process.env.MONGODB_URI?.trim() && process.env.MONGODB_DB?.trim());
}

function readConfirmToken() {
  const args = process.argv.slice(2);
  const inlineConfirm = args.find((arg) => arg.startsWith("--confirm="));

  if (inlineConfirm) {
    return inlineConfirm.split("=", 2)[1];
  }

  const confirmIndex = args.indexOf("--confirm");

  if (confirmIndex >= 0) {
    return args[confirmIndex + 1];
  }

  return process.env.VIBE_MALL_TEARDOWN_CONFIRM;
}

function isConfirmed() {
  return readConfirmToken() === CONFIRM_TOKEN;
}

function shouldSkipSearchIndex() {
  return process.argv.includes("--skip-search-index");
}

function printUsage(dbName?: string) {
  console.log("");
  console.log("Vibe Mall teardown is guarded because it deletes demo data.");

  if (dbName) {
    console.log(`Target database: ${dbName}`);
    console.log(`Collections: ${APP_COLLECTIONS.join(", ")}`);
    console.log(`Search index: ${PRODUCT_VECTOR_INDEX_NAME}`);
  }

  console.log("");
  console.log("To run teardown:");
  console.log(`  npm run teardown -- --confirm ${CONFIRM_TOKEN}`);
  console.log("");
  console.log("To keep the Atlas Vector Search index:");
  console.log(`  npm run teardown -- --confirm ${CONFIRM_TOKEN} --skip-search-index`);
  console.log("");
  console.log("After teardown, start fresh with:");
  console.log("  npm run seed");
}

function assertSafeDatabaseName(dbName: string) {
  if (PROTECTED_DATABASES.has(dbName)) {
    throw new Error(`Refusing to teardown protected MongoDB database: ${dbName}`);
  }
}

async function collectionExists(db: Db, collectionName: string) {
  const collections = await db
    .listCollections({ name: collectionName }, { nameOnly: true })
    .toArray();

  return collections.length > 0;
}

async function dropProductSearchIndex(db: Db) {
  if (!(await collectionExists(db, "products"))) {
    console.log(`Search index ${PRODUCT_VECTOR_INDEX_NAME}: products collection not found.`);
    return;
  }

  try {
    const products = db.collection("products");
    const existingIndexes = await products.listSearchIndexes(PRODUCT_VECTOR_INDEX_NAME).toArray();

    if (existingIndexes.length === 0) {
      console.log(`Search index ${PRODUCT_VECTOR_INDEX_NAME}: not found.`);
      return;
    }

    await products.dropSearchIndex(PRODUCT_VECTOR_INDEX_NAME);
    console.log(`Search index ${PRODUCT_VECTOR_INDEX_NAME}: dropped.`);
  } catch (error: unknown) {
    console.warn(`Search index ${PRODUCT_VECTOR_INDEX_NAME}: direct drop failed.`);
    console.warn(error instanceof Error ? error.message : error);
    console.warn("Continuing with collection cleanup.");
  }
}

async function dropCollectionIfPresent(db: Db, collectionName: string) {
  if (!(await collectionExists(db, collectionName))) {
    console.log(`Collection ${collectionName}: not found.`);
    return;
  }

  await db.collection(collectionName).drop();
  console.log(`Collection ${collectionName}: dropped.`);
}

async function main() {
  if (!hasMongoEnv()) {
    console.log("MongoDB teardown was not run because MONGODB_URI or MONGODB_DB is missing.");
    printUsage();
    return;
  }

  const dbName = process.env.MONGODB_DB?.trim();

  if (!dbName) {
    throw new Error("MONGODB_DB is required for teardown.");
  }

  assertSafeDatabaseName(dbName);

  if (!isConfirmed()) {
    console.log("No data was deleted.");
    printUsage(dbName);
    return;
  }

  const client = await getMongoClient();
  const db = client.db(dbName);

  try {
    console.log(`Tearing down Vibe Mall demo data in database ${dbName}.`);

    if (shouldSkipSearchIndex()) {
      console.log(`Search index ${PRODUCT_VECTOR_INDEX_NAME}: skipped.`);
    } else {
      await dropProductSearchIndex(db);
    }

    for (const collectionName of APP_COLLECTIONS) {
      await dropCollectionIfPresent(db, collectionName);
    }

    console.log("");
    console.log("Vibe Mall teardown complete.");
    console.log("Start fresh with:");
    console.log("  npm run seed");
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error("Teardown failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
