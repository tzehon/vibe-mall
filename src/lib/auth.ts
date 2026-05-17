import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb, hasMongoConfig } from "./mongodb";
import type { Storefront, User } from "./models";
import {
  createSignedSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  verifySignedSessionToken
} from "./session";

export type AuthUser = {
  _id: string;
  email: string;
  name: string;
};

export class AuthenticationError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("AUTH_SECRET is required for signed session cookies.");
  }

  return secret;
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}

function toAuthUser(user: User): AuthUser {
  return {
    _id: user._id.toHexString(),
    email: user.email,
    name: user.name
  };
}

function getCookieFromHeader(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function getUserFromSessionToken(token: string | undefined) {
  if (!token || !hasMongoConfig()) {
    return null;
  }

  let payload;

  try {
    payload = verifySignedSessionToken(token, getAuthSecret());
  } catch {
    return null;
  }

  if (!payload || !ObjectId.isValid(payload.userId)) {
    return null;
  }

  let user: User | null;

  try {
    const db = await getDb();
    user = await db.collection<User>("users").findOne({
      _id: new ObjectId(payload.userId)
    });
  } catch {
    return null;
  }

  return user ? toAuthUser(user) : null;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return getUserFromSessionToken(token);
}

export async function getCurrentUserFromRequest(request: Request) {
  const token = getCookieFromHeader(request, SESSION_COOKIE_NAME);

  return getUserFromSessionToken(token);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthenticationError();
  }

  return user;
}

export function createSession(response: NextResponse, userId: string) {
  const token = createSignedSessionToken(userId, getAuthSecret());

  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

export function destroySession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0
  });
}

function idToString(value: ObjectId | string) {
  return typeof value === "string" ? value : value.toHexString();
}

export function canEditStorefront(
  userId: ObjectId | string | null | undefined,
  storefront: Pick<Storefront, "ownerId">
) {
  if (!userId) {
    return false;
  }

  return idToString(userId) === idToString(storefront.ownerId);
}

export function canViewStorefront(
  userId: ObjectId | string | null | undefined,
  storefront: Pick<Storefront, "ownerId" | "status">
) {
  return storefront.status === "published" || canEditStorefront(userId, storefront);
}

export function sanitizeNextPath(value: string | null | undefined, fallback = "/create") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}
