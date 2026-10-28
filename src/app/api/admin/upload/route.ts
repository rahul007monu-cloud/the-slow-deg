import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { adminRoute } from "@/lib/api";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const MAX = 4 * 1024 * 1024; // Vercel functions accept ~4.5 MB request bodies

export const POST = adminRoute(async (req) => {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return Response.json({ error: "Use a JPG, PNG, WebP or AVIF image" }, { status: 415 });
  if (file.size > MAX) return Response.json({ error: "Image is larger than 4 MB. Please compress it first." }, { status: 413 });
  const name = `dishes/${Date.now()}-${randomBytes(3).toString("hex")}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, file, { access: "public", contentType: file.type });
    return Response.json({ url: blob.url });
  }
  if (!process.env.VERCEL) {
    const dest = path.join(process.cwd(), "public", "uploads", name);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, Buffer.from(await file.arrayBuffer()));
    return Response.json({ url: `/uploads/${name}` });
  }
  return Response.json({ error: "Photo storage not connected. In Vercel open Storage → Create → Blob, connect it to this project, then redeploy. Or paste an image link instead." }, { status: 503 });
});
