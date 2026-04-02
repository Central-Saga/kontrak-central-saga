import { NextResponse } from "next/server";

import { clearSessionToken, readSessionState } from "@/lib/auth/session";

export async function GET() {
  const session = await readSessionState();

  if (session.status === "guest") {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (session.status === "stale") {
    await clearSessionToken();

    return NextResponse.json(
      {
        authenticated: false,
        reason: "session-expired",
      },
      { status: 401 },
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      data: session.user,
    },
    { status: 200 },
  );
}
