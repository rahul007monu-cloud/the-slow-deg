import { dateStatus } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  return Response.json(await dateStatus(date), { headers: { "Cache-Control": "no-store" } });
}
