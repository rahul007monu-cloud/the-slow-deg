import { adminConfigured, checkCredentials, clientIp, startSession } from "@/lib/auth";
import { sameOrigin } from "@/lib/api";
import { clearRateLimit, rateLimited } from "@/lib/store";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "Bad origin" }, { status: 403 });
  if (!adminConfigured) return Response.json({ error: "Admin login is not set up yet. Add ADMIN_EMAIL and ADMIN_PASSWORD in Vercel → Settings → Environment Variables, then redeploy." }, { status: 503 });
  const ip = clientIp(req);
  if (await rateLimited(`login:${ip}`, 5, 15 * 60)) return Response.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!checkCredentials(email, password)) return Response.json({ error: "Wrong email or password" }, { status: 401 });
  await clearRateLimit(`login:${ip}`);
  await startSession();
  return Response.json({ ok: true });
}
