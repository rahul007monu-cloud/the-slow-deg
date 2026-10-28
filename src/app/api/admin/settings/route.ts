import { revalidatePath } from "next/cache";
import { adminRoute } from "@/lib/api";
import { getSettings, saveSettings } from "@/lib/store";
import { settingsSchema } from "@/lib/types";

export const GET = adminRoute(async () => Response.json(await getSettings()));

export const PUT = adminRoute(async (req) => {
  const s = settingsSchema.parse(await req.json());
  if (s.minGuests > s.maxGuests) return Response.json({ error: "Minimum guests cannot be more than maximum guests" }, { status: 422 });
  await saveSettings(s);
  revalidatePath("/");
  return Response.json(s);
});
