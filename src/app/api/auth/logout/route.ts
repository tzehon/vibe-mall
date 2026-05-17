import { NextResponse } from "next/server";

import { destroySession } from "@/lib/auth";

export async function POST(request: Request) {
  const acceptsJson = request.headers.get("accept")?.includes("application/json");
  const response = acceptsJson
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL("/", request.url), { status: 303 });

  destroySession(response);

  return response;
}
