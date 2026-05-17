import { ObjectId } from "mongodb";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AuthUser } from "@/lib/auth";
import type { Storefront } from "@/lib/models";

const ownerId = new ObjectId("507f1f77bcf86cd799439011");
const otherOwnerId = new ObjectId("507f1f77bcf86cd799439012");

const ownerUser: AuthUser = {
  _id: ownerId.toHexString(),
  email: "demo@vibemall.local",
  name: "Demo Merchant"
};

function storefront(owner = ownerId): Storefront {
  return {
    _id: new ObjectId("507f1f77bcf86cd799439013"),
    ownerId: owner,
    vibe: "Pokemon style cute birthday",
    title: "Birthday Shelf",
    slug: "birthday-shelf",
    productIds: [],
    productsSnapshot: [],
    generatedHtml: "<!doctype html><html><body>Birthday Shelf</body></html>",
    status: "draft",
    createdAt: new Date("2026-05-16T00:00:00.000Z")
  };
}

async function importRoute({
  currentUser,
  foundStorefront,
  updateOne
}: {
  currentUser: AuthUser | null;
  foundStorefront: Storefront | null;
  updateOne?: ReturnType<typeof vi.fn>;
}) {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  vi.doMock("@/lib/auth", async () => {
    const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");

    return {
      ...actual,
      getCurrentUserFromRequest: async () => currentUser
    };
  });
  vi.doMock("@/lib/storefronts", () => ({
    findStorefrontByIdOrSlug: async () => foundStorefront
  }));
  vi.doMock("@/lib/mongodb", () => ({
    getDb: async () => ({
      collection: () => ({
        updateOne: updateOne ?? vi.fn()
      })
    })
  }));

  return import("./route");
}

describe("POST /api/storefronts/[id]/publish", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("requires auth", async () => {
    const { POST } = await importRoute({
      currentUser: null,
      foundStorefront: null
    });
    const response = await POST(new Request("http://localhost/api/storefronts/draft/publish"), {
      params: Promise.resolve({ id: "draft" })
    });

    expect(response.status).toBe(401);
  });

  it("requires storefront ownership", async () => {
    const { POST } = await importRoute({
      currentUser: ownerUser,
      foundStorefront: storefront(otherOwnerId)
    });
    const response = await POST(new Request("http://localhost/api/storefronts/draft/publish"), {
      params: Promise.resolve({ id: "draft" })
    });

    expect(response.status).toBe(403);
  });

  it("publishes an owned draft and returns public and embed URLs", async () => {
    const updateOne = vi.fn(async () => ({ matchedCount: 1 }));
    const foundStorefront = storefront();
    const { POST } = await importRoute({
      currentUser: ownerUser,
      foundStorefront,
      updateOne
    });
    const response = await POST(new Request("http://localhost/api/storefronts/draft/publish"), {
      params: Promise.resolve({ id: "draft" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateOne).toHaveBeenCalledWith(
      {
        _id: foundStorefront._id,
        ownerId
      },
      {
        $set: expect.objectContaining({
          status: "published",
          publishedAt: expect.any(Date)
        })
      }
    );
    expect(body).toEqual({
      embedUrl: "http://localhost:3000/storefronts/birthday-shelf/embed",
      storefrontId: foundStorefront._id.toHexString(),
      publicUrl: "http://localhost:3000/storefronts/birthday-shelf",
      status: "published"
    });
  });
});
