import { ObjectId } from "mongodb";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AuthUser } from "@/lib/auth";
import type { Storefront } from "@/lib/models";

const ownerId = new ObjectId("507f1f77bcf86cd799439011");
const otherUser: AuthUser = {
  _id: "507f1f77bcf86cd799439012",
  email: "other@example.com",
  name: "Other Merchant"
};

function storefront(status: Storefront["status"]): Storefront {
  return {
    _id: new ObjectId("507f1f77bcf86cd799439013"),
    ownerId,
    trend: "Pokemon style cute birthday",
    title: "Birthday Shelf",
    slug: "birthday-shelf",
    productIds: [],
    productsSnapshot: [],
    generatedHtml: "<!doctype html><html><body>Birthday Shelf</body></html>",
    status,
    createdAt: new Date("2026-05-16T00:00:00.000Z"),
    publishedAt: status === "published" ? new Date("2026-05-16T01:00:00.000Z") : undefined
  };
}

async function importRouteWithStorefront(
  foundStorefront: Storefront | null,
  user: AuthUser | null
) {
  vi.doMock("@/lib/auth", () => ({
    getCurrentUserFromRequest: async () => user
  }));
  vi.doMock("@/lib/storefronts", () => ({
    findStorefrontForViewer: async () => {
      if (!foundStorefront) {
        return null;
      }

      if (
        foundStorefront.status === "published" ||
        user?._id === foundStorefront.ownerId.toHexString()
      ) {
        return foundStorefront;
      }

      return null;
    }
  }));

  return import("./route");
}

describe("GET /storefronts/[id]/embed", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("forbids draft embed access for non-owners", async () => {
    const { GET } = await importRouteWithStorefront(storefront("draft"), otherUser);
    const response = await GET(new Request("http://localhost/storefronts/draft/embed"), {
      params: Promise.resolve({ id: "draft" })
    });

    expect(response.status).toBe(404);
  });

  it("serves published embed HTML publicly with CSP", async () => {
    const { GET } = await importRouteWithStorefront(storefront("published"), null);
    const response = await GET(new Request("http://localhost/storefronts/birthday-shelf/embed"), {
      params: Promise.resolve({ id: "birthday-shelf" })
    });

    expect(response.status).toBe(200);
    const html = await response.text();

    expect(html).toContain("<!doctype html>");
    expect(html).toContain('rel="icon"');
    expect(html).toContain("data:image/svg+xml");
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(response.headers.get("cache-control")).toContain("public");
    const csp = response.headers.get("content-security-policy");

    expect(csp).toBeTruthy();
    expect(csp).toContain("script-src 'none'");
    expect(csp).toContain("img-src data:");
    expect(csp).not.toContain("https:");
    expect(csp).toContain("form-action 'none'");
  });

  it("serves owner-only draft embeds without caching", async () => {
    const ownerUser: AuthUser = {
      _id: ownerId.toHexString(),
      email: "demo@trendmall.local",
      name: "Demo Merchant"
    };
    const { GET } = await importRouteWithStorefront(storefront("draft"), ownerUser);
    const response = await GET(new Request("http://localhost/storefronts/draft/embed"), {
      params: Promise.resolve({ id: "draft" })
    });

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain('rel="icon"');
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
