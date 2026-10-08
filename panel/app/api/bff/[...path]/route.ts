import type { NextRequest } from "next/server";
import { forward } from "@/lib/server/backend";

type Ctx = { params: Promise<{ path: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
