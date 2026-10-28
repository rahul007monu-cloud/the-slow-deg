import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getBlockedDates, getMenu, getSettings, listBookings, storeReady } from "@/lib/store";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [settings, menu, bookings, blocked] = await Promise.all([getSettings(), getMenu(), listBookings(), getBlockedDates()]);
  return <AdminDashboard initial={{ settings, menu, bookings, blocked }} storeReady={storeReady} blobReady={Boolean(process.env.BLOB_READ_WRITE_TOKEN) || !process.env.VERCEL} />;
}
