import nextEnv from "@next/env";

import {
  createOrVerifyProductVectorSearchIndex,
  printProductVectorSearchIndexFailure
} from "../lib/atlasVectorIndex";
import { getMongoClient } from "../lib/mongodb";
import {
  buildSeedProducts,
  DEMO_USERS,
  hashDemoPassword,
  seedDataFingerprint
} from "../lib/seed-data";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function hasMongoEnv() {
  return Boolean(process.env.MONGODB_URI?.trim() && process.env.MONGODB_DB?.trim());
}

function printDemoUsers() {
  DEMO_USERS.forEach((user) => {
    console.log(`${user.label}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
  });
}

async function main() {
  const products = buildSeedProducts();
  const fingerprint = seedDataFingerprint(products);

  console.log(`Prepared ${products.length} Trend Mall products.`);
  console.log(`Seed fingerprint: ${fingerprint}`);

  if (!hasMongoEnv()) {
    console.log("");
    console.log("MongoDB Atlas seed was not run because MONGODB_URI or MONGODB_DB is missing.");
    console.log("Add both variables to .env.local, then rerun:");
    console.log("  npm run seed");
    console.log("");
    console.log("Demo merchants that will be created:");
    printDemoUsers();
    return;
  }

  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB?.trim();
  const db = client.db(dbName);

  try {
    await Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("products").createIndex({ sku: 1 }, { unique: true }),
      db.collection("products").createIndex({ active: 1, category: 1 }),
      db.collection("storefronts").createIndex({ ownerId: 1, createdAt: -1 }),
      db.collection("storefronts").createIndex({ slug: 1 }, { unique: true, sparse: true }),
      db.collection("storefronts").createIndex({ status: 1, publishedAt: -1 })
    ]);

    await Promise.all(
      DEMO_USERS.map((user) =>
        db.collection("users").updateOne(
          { email: user.email },
          {
            $set: {
              name: user.name,
              passwordHash: hashDemoPassword(user.password, user.email)
            },
            $setOnInsert: {
              email: user.email,
              createdAt: new Date("2026-05-16T00:00:00.000Z")
            }
          },
          { upsert: true }
        )
      )
    );

    const result = await db.collection("products").bulkWrite(
      products.map((product) => ({
        updateOne: {
          filter: { sku: product.sku },
          update: {
            $set: product
          },
          upsert: true
        }
      })),
      { ordered: false }
    );

    console.log("");
    console.log("MongoDB Atlas seed complete.");
    console.log(`Products matched: ${result.matchedCount}`);
    console.log(`Products inserted: ${result.upsertedCount}`);
    console.log(`Products modified: ${result.modifiedCount}`);
    console.log("");
    console.log("Demo merchants:");
    printDemoUsers();
    console.log("");
    console.log("Creating or verifying the Atlas Vector Search index...");

    try {
      await createOrVerifyProductVectorSearchIndex(db);
    } catch (error: unknown) {
      console.error("");
      console.error("MongoDB Atlas seed data was written, but index setup failed.");
      printProductVectorSearchIndexFailure(error, dbName);
      process.exitCode = 1;
      return;
    }

    console.log("");
    console.log("Seed and Atlas Vector Search index setup complete.");
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error("Seed failed before Atlas index setup completed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
