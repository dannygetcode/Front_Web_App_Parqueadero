import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { rejectForeignOrigin } from "@/lib/server/origin";

export async function POST(req: NextRequest) {
  const foreign = rejectForeignOrigin(req);
  if (foreign) return foreign;

  const out = NextResponse.json({ ok: true });
  out.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return out;
}
