import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";

import { getStorefrontPageAccess } from "./storefrontAccess";

describe("getStorefrontPageAccess", () => {
  it("hides draft share pages from non-owners", () => {
    const ownerId = new ObjectId("507f1f77bcf86cd799439011");
    const otherUser = {
      _id: "507f1f77bcf86cd799439012",
      email: "other@example.com",
      name: "Other Merchant"
    };

    expect(getStorefrontPageAccess({ ownerId, status: "draft" }, otherUser)).toBe("hidden");
  });

  it("keeps published share pages public", () => {
    const ownerId = new ObjectId("507f1f77bcf86cd799439011");

    expect(getStorefrontPageAccess({ ownerId, status: "published" }, null)).toBe("visible");
  });
});
