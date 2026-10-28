import { z } from "zod";
import { adminRoute } from "@/lib/api";
import { deleteBooking, getBooking, listBookings, saveBooking } from "@/lib/store";

export const GET = adminRoute(async () => Response.json(await listBookings()));

const patch = z.object({ ref: z.string().max(40), status: z.enum(["pending", "confirmed", "rejected"]) });

export const PATCH = adminRoute(async (req) => {
  const { ref, status } = patch.parse(await req.json());
  const b = await getBooking(ref);
  if (!b) return Response.json({ error: "Booking not found" }, { status: 404 });
  if (status === "confirmed") {
    const clash = (await listBookings()).find((x) => x.ref !== ref && x.date === b.date && x.status === "confirmed");
    if (clash) return Response.json({ error: `${b.date} already has a confirmed booking (${clash.ref}). Decline one first.` }, { status: 409 });
  }
  const updated = { ...b, status };
  await saveBooking(updated);
  return Response.json(updated);
});

export const DELETE = adminRoute(async (req) => {
  const ref = new URL(req.url).searchParams.get("ref") ?? "";
  if (!ref) return Response.json({ error: "Missing ref" }, { status: 400 });
  await deleteBooking(ref);
  return Response.json({ ok: true });
});
