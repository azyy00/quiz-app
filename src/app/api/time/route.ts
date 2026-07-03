import { NextResponse } from "next/server";

// Server clock, used by clients to correct for local clock skew.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ now: Date.now() });
}
