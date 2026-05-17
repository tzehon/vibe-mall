import { Db, MongoClient } from "mongodb";

type MongoGlobal = typeof globalThis & {
  _vibeMallMongoClientPromise?: Promise<MongoClient>;
};

let mongoClientPromise: Promise<MongoClient> | undefined;

function readRequiredEnv(name: "MONGODB_URI" | "MONGODB_DB") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is required for MongoDB Atlas persistence. Add ${name} to .env.local or the deployment environment.`
    );
  }

  return value;
}

export function hasMongoConfig() {
  return Boolean(process.env.MONGODB_URI?.trim() && process.env.MONGODB_DB?.trim());
}

export function getMongoClient() {
  const uri = readRequiredEnv("MONGODB_URI");
  const globalForMongo = globalThis as MongoGlobal;

  if (process.env.NODE_ENV === "development") {
    globalForMongo._vibeMallMongoClientPromise ??= new MongoClient(uri).connect();
    return globalForMongo._vibeMallMongoClientPromise;
  }

  mongoClientPromise ??= new MongoClient(uri).connect();
  return mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const dbName = readRequiredEnv("MONGODB_DB");
  const client = await getMongoClient();

  return client.db(dbName);
}
