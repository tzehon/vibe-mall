import { NextResponse } from "next/server";

import { createSession, sanitizeNextPath } from "@/lib/auth";
import { getDb, hasMongoConfig } from "@/lib/mongodb";
import type { User } from "@/lib/models";
import { verifyPassword } from "@/lib/passwords";

type LoginInput = {
  email: string;
  password: string;
  next: string;
  wantsRedirect: boolean;
};

async function parseLoginInput(request: Request): Promise<LoginInput> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as Partial<LoginInput>;

    return {
      email: String(body.email ?? "").trim().toLowerCase(),
      password: String(body.password ?? ""),
      next: sanitizeNextPath(body.next),
      wantsRedirect: false
    };
  }

  const formData = await request.formData();

  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    next: sanitizeNextPath(String(formData.get("next") ?? "")),
    wantsRedirect: true
  };
}

function loginRedirect(request: Request, params: Record<string, string>) {
  const url = new URL("/login", request.url);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  const input = await parseLoginInput(request);

  if (!input.email || !input.password) {
    if (input.wantsRedirect) {
      return loginRedirect(request, {
        error: "missing",
        email: input.email,
        next: input.next
      });
    }

    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (!hasMongoConfig()) {
    if (input.wantsRedirect) {
      return loginRedirect(request, {
        error: "setup",
        email: input.email,
        next: input.next
      });
    }

    return NextResponse.json(
      { error: "MongoDB is not configured. Set MONGODB_URI and MONGODB_DB." },
      { status: 503 }
    );
  }

  const db = await getDb();
  const user = await db.collection<User>("users").findOne({ email: input.email });

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    if (input.wantsRedirect) {
      return loginRedirect(request, {
        error: "invalid",
        email: input.email,
        next: input.next
      });
    }

    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  try {
    const redirectUrl = new URL(input.next, request.url);
    const response = input.wantsRedirect
      ? NextResponse.redirect(redirectUrl, { status: 303 })
      : NextResponse.json({
          user: {
            _id: user._id.toHexString(),
            email: user.email,
            name: user.name
          }
        });

    createSession(response, user._id.toHexString());

    return response;
  } catch (error) {
    if (input.wantsRedirect) {
      return loginRedirect(request, {
        error: "setup",
        email: input.email,
        next: input.next
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not create session."
      },
      { status: 500 }
    );
  }
}
