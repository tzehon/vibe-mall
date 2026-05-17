import { NextResponse } from "next/server";

import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);

  return NextResponse.json({ user });
}
