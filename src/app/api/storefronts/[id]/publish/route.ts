import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { canEditStorefront, getCurrentUserFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import type { Storefront } from "@/lib/models";
import { findStorefrontByIdOrSlug } from "@/lib/storefronts";
import { getStorefrontEmbedUrl, getStorefrontShareUrl } from "@/lib/storefrontUrls";

type PublishRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function POST(request: Request, { params }: PublishRouteContext) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const storefront = await findStorefrontByIdOrSlug(id);

  if (!storefront) {
    return NextResponse.json({ error: "Storefront not found." }, { status: 404 });
  }

  if (!canEditStorefront(user._id, storefront)) {
    return NextResponse.json(
      { error: "You can only publish storefronts that you own." },
      { status: 403 }
    );
  }

  const db = await getDb();
  const publishedAt = storefront.publishedAt ?? new Date();

  const updateResult = await db.collection<Storefront>("storefronts").updateOne(
    {
      _id: storefront._id,
      ownerId: new ObjectId(user._id)
    },
    {
      $set: {
        status: "published",
        publishedAt
      }
    }
  );

  if (updateResult.matchedCount === 0) {
    return NextResponse.json({ error: "Storefront not found." }, { status: 404 });
  }

  return NextResponse.json({
    storefrontId: storefront._id.toHexString(),
    embedUrl: getStorefrontEmbedUrl({
      _id: storefront._id,
      slug: storefront.slug
    }),
    publicUrl: getStorefrontShareUrl({
      _id: storefront._id,
      slug: storefront.slug
    }),
    status: "published"
  });
}
