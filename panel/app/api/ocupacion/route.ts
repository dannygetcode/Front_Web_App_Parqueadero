import { ocupacionSchema } from "@/lib/schemas";
import { proxyGet } from "@/lib/server/backend";

export async function GET() {
  return proxyGet("/api/accesos/ocupacion", ocupacionSchema);
}
