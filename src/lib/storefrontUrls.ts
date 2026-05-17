import type { ObjectId } from "mongodb";

function idToString(value: ObjectId | string) {
  return typeof value === "string" ? value : value.toHexString();
}

export function getAppBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(
    /\/+$/,
    ""
  );
}

export function getStorefrontSharePath(storefront: {
  _id: ObjectId | string;
  slug?: string;
}) {
  const shareId = storefront.slug?.trim() || idToString(storefront._id);

  return `/storefronts/${encodeURIComponent(shareId)}`;
}

export function getStorefrontEmbedPath(storefront: {
  _id: ObjectId | string;
  slug?: string;
}) {
  return `${getStorefrontSharePath(storefront)}/embed`;
}

export function getStorefrontShareUrl(
  storefront: {
    _id: ObjectId | string;
    slug?: string;
  },
  baseUrl = getAppBaseUrl()
) {
  return `${baseUrl}${getStorefrontSharePath(storefront)}`;
}

export function getStorefrontEmbedUrl(
  storefront: {
    _id: ObjectId | string;
    slug?: string;
  },
  baseUrl = getAppBaseUrl()
) {
  return `${baseUrl}${getStorefrontEmbedPath(storefront)}`;
}
