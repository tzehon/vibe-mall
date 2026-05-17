import { ObjectId } from "mongodb";

import { canViewStorefront, type AuthUser } from "./auth";
import { getDb, hasMongoConfig } from "./mongodb";
import type { Storefront } from "./models";

export type StorefrontCard = {
  _id: string;
  ownerId: string;
  trend: string;
  title: string;
  slug: string;
  status: Storefront["status"];
  createdAt: Date;
  publishedAt?: Date;
  productCount: number;
  productNames: string[];
};

function storefrontIdQuery(idOrSlug: string) {
  if (ObjectId.isValid(idOrSlug)) {
    return {
      $or: [{ _id: new ObjectId(idOrSlug) }, { slug: idOrSlug }]
    };
  }

  return { slug: idOrSlug };
}

function toStorefrontCard(storefront: Storefront): StorefrontCard {
  return {
    _id: storefront._id.toHexString(),
    ownerId: storefront.ownerId.toHexString(),
    trend: storefront.trend,
    title: storefront.title,
    slug: storefront.slug,
    status: storefront.status,
    createdAt: storefront.createdAt,
    publishedAt: storefront.publishedAt,
    productCount: storefront.productsSnapshot.length,
    productNames: storefront.productsSnapshot.slice(0, 3).map((product) => product.name)
  };
}

export async function findStorefrontByIdOrSlug(idOrSlug: string) {
  if (!hasMongoConfig()) {
    return null;
  }

  const db = await getDb();

  return db.collection<Storefront>("storefronts").findOne(storefrontIdQuery(idOrSlug));
}

export async function findStorefrontForViewer(idOrSlug: string, user: AuthUser | null) {
  const storefront = await findStorefrontByIdOrSlug(idOrSlug);

  if (!storefront || !canViewStorefront(user?._id, storefront)) {
    return null;
  }

  return storefront;
}

export async function getPublishedStorefrontCards(limit = 9) {
  if (!hasMongoConfig()) {
    return [];
  }

  const db = await getDb();
  const storefronts = await db
    .collection<Storefront>("storefronts")
    .find({ status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .toArray();

  return storefronts.map(toStorefrontCard);
}

export async function getOwnerStorefrontCards(ownerId: string, limit = 9) {
  if (!hasMongoConfig() || !ObjectId.isValid(ownerId)) {
    return [];
  }

  const db = await getDb();
  const storefronts = await db
    .collection<Storefront>("storefronts")
    .find({ ownerId: new ObjectId(ownerId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return storefronts.map(toStorefrontCard);
}
