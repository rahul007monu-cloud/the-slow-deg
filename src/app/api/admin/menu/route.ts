import { revalidatePath } from "next/cache";
import { adminRoute } from "@/lib/api";
import { getMenu, saveMenu } from "@/lib/store";
import { menuSchema } from "@/lib/types";

export const GET = adminRoute(async () => Response.json(await getMenu()));

export const PUT = adminRoute(async (req) => {
  const menu = menuSchema.parse(await req.json());
  const ids = new Set(menu.map((d) => d.id));
  if (ids.size !== menu.length) return Response.json({ error: "Two dishes have the same ID" }, { status: 422 });
  await saveMenu(menu);
  revalidatePath("/");
  return Response.json(menu);
});
