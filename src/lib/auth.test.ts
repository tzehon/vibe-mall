import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";

import { POST as generatePost } from "@/app/api/generate/route";

import { canEditStorefront, canViewStorefront } from "./auth";
import { hashPassword, verifyPassword } from "./passwords";
import { createSignedSessionToken, SESSION_TTL_SECONDS, verifySignedSessionToken } from "./session";

describe("password hashing", () => {
  it("verifies matching PBKDF2 password hashes", () => {
    const hash = hashPassword("vibe-mall-demo", { salt: "unit-test-salt" });

    expect(verifyPassword("vibe-mall-demo", hash)).toBe(true);
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });
});

describe("signed sessions", () => {
  it("signs and verifies session payloads", () => {
    const token = createSignedSessionToken("507f1f77bcf86cd799439011", "test-secret", 1000);
    const payload = verifySignedSessionToken(token, "test-secret", 2000);

    expect(payload?.userId).toBe("507f1f77bcf86cd799439011");
  });

  it("rejects tampered or expired session tokens", () => {
    const token = createSignedSessionToken("507f1f77bcf86cd799439011", "test-secret", 1000);
    const [encodedPayload, signature] = token.split(".");
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...payload, userId: "507f1f77bcf86cd799439012" }),
      "utf8"
    ).toString("base64url");
    const tampered = `${tamperedPayload}.${signature}`;

    expect(verifySignedSessionToken(tampered, "test-secret", 2000)).toBeNull();
    expect(
      verifySignedSessionToken(token, "test-secret", 1000 + SESSION_TTL_SECONDS * 1000 + 1)
    ).toBeNull();
  });
});

describe("storefront authorization", () => {
  it("does not allow a non-owner to publish or edit another draft", () => {
    const ownerId = new ObjectId();
    const otherUserId = new ObjectId();

    expect(canEditStorefront(otherUserId, { ownerId })).toBe(false);
  });

  it("allows published storefronts to be public and keeps drafts owner-only", () => {
    const ownerId = new ObjectId();

    expect(canViewStorefront(null, { ownerId, status: "published" })).toBe(true);
    expect(canViewStorefront(null, { ownerId, status: "draft" })).toBe(false);
    expect(canViewStorefront(ownerId, { ownerId, status: "draft" })).toBe(true);
  });
});

describe("protected route behavior", () => {
  it("returns 401 for unauthenticated POST /api/generate", async () => {
    const response = await generatePost(
      new Request("http://localhost/api/generate", { method: "POST" })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication required.",
      errorCode: "auth_required"
    });
  });
});
