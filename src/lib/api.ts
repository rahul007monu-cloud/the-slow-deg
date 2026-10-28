import "server-only";
import { StoreNotConfigured } from "./store";
import { requireAdmin } from "./auth";

/** Blocks cross-site form posts against admin routes (on top of the SameSite=Strict cookie). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches from older browsers may omit it
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

/** Wraps an admin handler: auth, origin check and consistent error responses. */
export function adminRoute(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    if (req.method !== "GET" && !sameOrigin(req)) return Response.json({ error: "Bad origin" }, { status: 403 });
    const denied = await requireAdmin();
    if (denied) return denied;
    try {
      return await handler(req);
    } catch (e) {
      if (e instanceof StoreNotConfigured) return Response.json({ error: e.message }, { status: 503 });
      if (e && typeof e === "object" && "issues" in e) return Response.json({ error: "Invalid data", issues: (e as { issues: unknown }).issues }, { status: 422 });
      console.error("Admin API error", e instanceof Error ? e.message : e);
      return Response.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}
