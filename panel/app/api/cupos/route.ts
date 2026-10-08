import { cuposSchema } from "@/lib/schemas";
import { proxyGet } from "@/lib/server/backend";

export async function GET() {
  return proxyGet("/api/cupos", cuposSchema);
}
