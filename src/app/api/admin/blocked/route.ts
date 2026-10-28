import { z } from "zod";
import { adminRoute } from "@/lib/api";
import { getBlockedDates, saveBlockedDates } from "@/lib/store";

export const GET = adminRoute(async () => Response.json(await getBlockedDates()));

export const PUT = adminRoute(async (req) => {
  const dates = z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(1000).parse(await req.json());
  await saveBlockedDates(dates);
  return Response.json(await getBlockedDates());
});
