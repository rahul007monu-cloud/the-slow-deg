"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateQuote, inr } from "@/lib/pricing";
import type { BookingStatus, Dish, Settings, StoredBooking } from "@/lib/types";

type Data = { settings: Settings; menu: Dish[]; bookings: StoredBooking[]; blocked: string[] };
type Tab = "bookings" | "price" | "menu" | "calendar";

async function api<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" }, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

const input = "w-full rounded-xl border border-cream/15 bg-coal/60 px-3 py-2.5 text-cream outline-none focus:border-saffron [color-scheme:dark]";

export function AdminDashboard({ initial, storeReady, blobReady }: { initial: Data; storeReady: boolean; blobReady: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("bookings");
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const notify = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  };
  const pending = initial.bookings.filter((b) => b.status === "pending").length;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  const tabs: [Tab, string][] = [
    ["bookings", `Bookings${pending ? ` (${pending})` : ""}`],
    ["price", "Price & settings"],
    ["menu", "Menu"],
    ["calendar", "Calendar"],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 text-cream sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-display text-3xl">The Slow Deg · Admin</div>
          <div className="text-xs text-cream/50">Changes go live on the website right after you save.</div>
        </div>
        <div className="flex gap-2 text-sm">
          <a href="/" target="_blank" className="rounded-full border border-cream/15 px-4 py-2 hover:border-saffron">
            View site
          </a>
          <button onClick={logout} className="rounded-full border border-cream/15 px-4 py-2 hover:border-ember">
            Log out
          </button>
        </div>
      </header>

      {!storeReady && (
        <div className="mt-6 rounded-2xl border border-ember/50 bg-ember/10 p-4 text-sm">
          <b>Database not connected.</b> You can look around, but saving will not work and bookings are only emailed. In Vercel open <b>Storage → Create Database → Upstash for Redis</b>, connect it to this project, then redeploy.
        </div>
      )}

      <nav className="mt-8 flex gap-2 overflow-x-auto pb-1">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${tab === id ? "bg-gradient-to-r from-saffron to-ember text-coal" : "border border-cream/15 text-cream/70 hover:text-cream"}`}>
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-8">
        {tab === "bookings" && <Bookings initial={initial.bookings} notify={notify} />}
        {tab === "price" && <PriceSettings initial={initial.settings} notify={notify} />}
        {tab === "menu" && <MenuEditor initial={initial.menu} notify={notify} blobReady={blobReady} />}
        {tab === "calendar" && <Calendar initial={initial.blocked} bookings={initial.bookings} notify={notify} />}
      </div>

      {toast && <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold shadow-xl ${toast.ok ? "bg-[#25D366] text-coal" : "bg-ember text-coal"}`}>{toast.msg}</div>}
    </div>
  );
}

type Notify = (ok: boolean, msg: string) => void;

/* ------------------------------ Bookings ------------------------------ */
function customerWa(phone: string, text: string) {
  let d = phone.replace(/\D/g, "");
  if (d.length === 10) d = `91${d}`;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

function Bookings({ initial, notify }: { initial: StoredBooking[]; notify: Notify }) {
  const [list, setList] = useState(initial);
  const [filter, setFilter] = useState<BookingStatus | "all">("pending");
  const shown = list.filter((b) => filter === "all" || b.status === filter);

  async function setStatus(b: StoredBooking, status: BookingStatus) {
    try {
      const u = await api<StoredBooking>("/api/admin/bookings", "PATCH", { ref: b.ref, status });
      setList((l) => l.map((x) => (x.ref === u.ref ? u : x)));
      notify(true, status === "confirmed" ? "Booking confirmed. Send the customer a WhatsApp." : "Booking updated");
    } catch (e) {
      notify(false, (e as Error).message);
    }
  }
  async function remove(b: StoredBooking) {
    if (!confirm(`Delete booking ${b.ref}? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/bookings?ref=${encodeURIComponent(b.ref)}`, "DELETE");
      setList((l) => l.filter((x) => x.ref !== b.ref));
      notify(true, "Deleted");
    } catch (e) {
      notify(false, (e as Error).message);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-sm">
        {(["pending", "confirmed", "rejected", "all"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full border px-4 py-1.5 capitalize ${filter === s ? "border-saffron text-saffron" : "border-cream/15 text-cream/60"}`}>
            {s === "rejected" ? "declined" : s} ({s === "all" ? list.length : list.filter((b) => b.status === s).length})
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="mt-10 text-center text-cream/40">No bookings here yet.</p>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {shown.map((b) => {
          const date = new Date(`${b.date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
          const msg =
            b.status === "confirmed"
              ? `Hi ${b.name}, your booking ${b.ref} with The Slow Deg is confirmed for ${date} from ${b.startTime}, ${b.guests} guests. Total ${inr(b.quote.total)}. Please pay the advance of ${inr(b.quote.advance)} to lock the date. Thank you!`
              : `Hi ${b.name}, this is the chef from The Slow Deg about your request ${b.ref} for ${date} (${b.guests} guests).`;
          return (
            <div key={b.ref} className="rounded-2xl glass p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-2xl">{date}</div>
                  <div className="text-sm text-cream/60">
                    from {b.startTime} · {b.guests} guests · {b.occasion}
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${b.status === "confirmed" ? "bg-[#25D366]/20 text-[#25D366]" : b.status === "rejected" ? "bg-cream/10 text-cream/50" : "bg-saffron/20 text-saffron"}`}>{b.status === "rejected" ? "declined" : b.status}</span>
              </div>
              <div className="mt-4 space-y-1 text-sm text-cream/75">
                <div>
                  <b className="text-cream">{b.name}</b>
                  {b.company ? ` · ${b.company}` : ""}
                </div>
                <div>
                  <a className="text-saffron" href={`tel:${b.phone}`}>
                    {b.phone}
                  </a>
                  {b.email && (
                    <>
                      {" · "}
                      <a className="text-saffron" href={`mailto:${b.email}`}>
                        {b.email}
                      </a>
                    </>
                  )}
                </div>
                <div>
                  {b.city}
                  {b.venue ? `, ${b.venue}` : ""}
                </div>
                {b.notes && <div className="text-cream/55">“{b.notes}”</div>}
                <div className="pt-2 text-cream">
                  {inr(b.quote.total)} <span className="text-cream/50">({inr(b.quote.pricePerPerson)}/guest · advance {inr(b.quote.advance)})</span>
                </div>
                <div className="text-xs text-cream/40">
                  {b.ref} · via {b.source === "ai" ? "AI assistant" : "website"}
                  {b.gstin ? ` · GSTIN ${b.gstin}` : ""}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {b.status !== "confirmed" && (
                  <button onClick={() => setStatus(b, "confirmed")} className="rounded-full bg-[#25D366] px-4 py-2 font-semibold text-coal">
                    Confirm
                  </button>
                )}
                {b.status !== "rejected" && (
                  <button onClick={() => setStatus(b, "rejected")} className="rounded-full border border-cream/20 px-4 py-2">
                    Decline
                  </button>
                )}
                <a href={customerWa(b.phone, msg)} target="_blank" rel="noopener" className="rounded-full border border-[#25D366]/60 px-4 py-2 text-[#25D366]">
                  WhatsApp customer
                </a>
                <button onClick={() => remove(b)} className="ml-auto rounded-full px-3 py-2 text-cream/40 hover:text-ember">
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ Price & settings ------------------------------ */
function PriceSettings({ initial, notify }: { initial: Settings; notify: Notify }) {
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState(false);
  const q = calculateQuote(50, s);
  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: Number(e.target.value) });

  async function save() {
    setBusy(true);
    try {
      setS(await api<Settings>("/api/admin/settings", "PUT", s));
      notify(true, "Saved. The website now shows the new price.");
    } catch (e) {
      notify(false, (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid gap-5 rounded-2xl glass p-6 sm:grid-cols-2">
        <L label="Price per guest (₹)">
          <input type="number" min={0} value={s.pricePerPerson} onChange={num("pricePerPerson")} className={`${input} font-display text-3xl`} />
        </L>
        <L label="GST %  (0 = no GST)">
          <input type="number" min={0} max={50} value={s.gstPercent} onChange={num("gstPercent")} className={input} />
        </L>
        <L label="Minimum guests">
          <input type="number" min={1} value={s.minGuests} onChange={num("minGuests")} className={input} />
        </L>
        <L label="Maximum guests (online)">
          <input type="number" min={1} value={s.maxGuests} onChange={num("maxGuests")} className={input} />
        </L>
        <L label="Advance %">
          <input type="number" min={0} max={100} value={s.advancePercent} onChange={num("advancePercent")} className={input} />
        </L>
        <L label="Minimum notice (days)">
          <input type="number" min={0} max={60} value={s.minNoticeDays} onChange={num("minNoticeDays")} className={input} />
        </L>
        <L label="Price note shown to customers" wide>
          <textarea rows={2} maxLength={300} value={s.priceNote} onChange={(e) => setS({ ...s, priceNote: e.target.value })} className={input} />
        </L>
        <L label="Chef WhatsApp number (with 91, digits only)">
          <input inputMode="numeric" value={s.whatsappNumber} onChange={(e) => setS({ ...s, whatsappNumber: e.target.value.replace(/\D/g, "") })} className={input} placeholder="919812345678" />
        </L>
        <L label="Email for new booking alerts">
          <input type="email" value={s.notifyEmail} onChange={(e) => setS({ ...s, notifyEmail: e.target.value.trim() })} className={input} placeholder="chef@example.com" />
        </L>
        <label className="flex items-center gap-3 text-sm text-cream/75 sm:col-span-2">
          <input type="checkbox" checked={s.oneEventPerDay} onChange={(e) => setS({ ...s, oneEventPerDay: e.target.checked })} className="h-4 w-4 accent-[#f0a93b]" />
          Only one event per day (a confirmed booking blocks that date)
        </label>
        <button onClick={save} disabled={busy} className="rounded-full bg-gradient-to-r from-saffron to-ember py-3.5 font-semibold text-coal disabled:opacity-60 sm:col-span-2">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
      <div className="h-fit rounded-2xl border border-saffron/30 bg-ash/40 p-6">
        <div className="text-xs tracking-widest text-saffron uppercase">Preview: 50 guests</div>
        <div className="mt-3 font-display text-5xl">{inr(q.total)}</div>
        <div className="mt-2 text-sm text-cream/60">
          {q.billedGuests} × {inr(q.pricePerPerson)} = {inr(q.subtotal)}
          {s.gstPercent ? ` + GST ${inr(q.gst)}` : ""}
        </div>
        <div className="mt-1 text-sm text-cream/60">Advance: {inr(q.advance)}</div>
        <p className="mt-4 text-xs text-cream/40">Booking alert emails need RESEND_API_KEY and BOOKING_EMAIL_FROM on Vercel. Without them, new bookings still appear in the Bookings tab.</p>
      </div>
    </div>
  );
}

function L({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block text-sm text-cream/70 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

/* ------------------------------ Menu ------------------------------ */
function newDish(): Dish {
  return { id: `dish-${Date.now().toString(36)}`, name: "New dish", hindi: "", description: "", category: "grill", tag: "Cooked live", heat: 2, signature: false, visible: true, photo: "/food/tandoori.webp", photoCredit: "" };
}

function MenuEditor({ initial, notify, blobReady }: { initial: Dish[]; notify: Notify; blobReady: boolean }) {
  const [menu, setMenu] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const dirty = useMemo(() => JSON.stringify(menu) !== JSON.stringify(initial), [menu, initial]);

  const update = (i: number, patch: Partial<Dish>) => setMenu((m) => m.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const move = (i: number, dir: -1 | 1) =>
    setMenu((m) => {
      const j = i + dir;
      if (j < 0 || j >= m.length) return m;
      const c = [...m];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  async function upload(i: number, file: File) {
    setUploading(menu[i].id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await api<{ url: string }>("/api/admin/upload", "POST", fd);
      update(i, { photo: url, photoCredit: "" });
      notify(true, "Photo uploaded. Press Save menu.");
    } catch (e) {
      notify(false, (e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setBusy(true);
    try {
      setMenu(await api<Dish[]>("/api/admin/menu", "PUT", menu));
      notify(true, "Menu saved and live on the website.");
    } catch (e) {
      notify(false, (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-2xl bg-coal/90 p-3 backdrop-blur">
        <button onClick={() => setMenu([...menu, newDish()])} className="rounded-full border border-cream/20 px-4 py-2 text-sm">
          + Add dish
        </button>
        <button onClick={save} disabled={busy || !dirty} className="rounded-full bg-gradient-to-r from-saffron to-ember px-6 py-2 text-sm font-semibold text-coal disabled:opacity-40">
          {busy ? "Saving…" : dirty ? "Save menu" : "Saved"}
        </button>
        <span className="text-xs text-cream/40">“Grill” dishes appear in the big showcase, “Deg” dishes in the curries &amp; biryani grid.</span>
      </div>
      <div className="mt-4 space-y-4">
        {menu.map((d, i) => (
          <div key={d.id} className={`grid gap-4 rounded-2xl glass p-4 md:grid-cols-[180px_1fr] ${d.visible ? "" : "opacity-50"}`}>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.photo} alt="" className="aspect-square w-full rounded-xl object-cover" />
              <label className={`mt-2 block cursor-pointer rounded-full border border-cream/20 py-1.5 text-center text-xs ${blobReady ? "" : "opacity-50"}`}>
                {uploading === d.id ? "Uploading…" : "Upload photo"}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" disabled={!blobReady || uploading !== null} onChange={(e) => e.target.files?.[0] && upload(i, e.target.files[0])} />
              </label>
              {!blobReady && <p className="mt-1 text-[10px] text-cream/40">Connect Vercel Blob to upload, or paste a link.</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <L label="Name">
                <input value={d.name} onChange={(e) => update(i, { name: e.target.value })} className={input} />
              </L>
              <L label="Hindi name (optional)">
                <input value={d.hindi} onChange={(e) => update(i, { hindi: e.target.value })} className={input} />
              </L>
              <L label="Description" wide>
                <textarea rows={2} maxLength={400} value={d.description} onChange={(e) => update(i, { description: e.target.value })} className={input} />
              </L>
              <L label="Tag (e.g. Cooked live, Slow-cooked 8 hrs)">
                <input value={d.tag} onChange={(e) => update(i, { tag: e.target.value })} className={input} />
              </L>
              <div className="grid grid-cols-2 gap-3">
                <L label="Section">
                  <select value={d.category} onChange={(e) => update(i, { category: e.target.value as Dish["category"] })} className={input}>
                    <option value="grill">Grill</option>
                    <option value="deg">Deg</option>
                  </select>
                </L>
                <L label="Spice (0-3)">
                  <input type="number" min={0} max={3} value={d.heat} onChange={(e) => update(i, { heat: Math.max(0, Math.min(3, Number(e.target.value))) })} className={input} />
                </L>
              </div>
              <L label="Photo link" wide>
                <input value={d.photo} onChange={(e) => update(i, { photo: e.target.value })} className={input} />
              </L>
              <L label="Photo credit (leave empty for your own photos)" wide>
                <input value={d.photoCredit} onChange={(e) => update(i, { photoCredit: e.target.value })} className={input} />
              </L>
              <div className="flex flex-wrap items-center gap-4 text-sm sm:col-span-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={d.visible} onChange={(e) => update(i, { visible: e.target.checked })} className="accent-[#f0a93b]" /> Show on website
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={d.signature} onChange={(e) => update(i, { signature: e.target.checked })} className="accent-[#f0a93b]" /> Signature
                </label>
                <span className="ml-auto flex gap-2">
                  <button onClick={() => move(i, -1)} className="rounded-full border border-cream/15 px-3 py-1" aria-label="Move up">
                    Up
                  </button>
                  <button onClick={() => move(i, 1)} className="rounded-full border border-cream/15 px-3 py-1" aria-label="Move down">
                    Down
                  </button>
                  <button onClick={() => confirm(`Remove ${d.name}?`) && setMenu(menu.filter((_, j) => j !== i))} className="rounded-full px-3 py-1 text-cream/50 hover:text-ember">
                    Remove
                  </button>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Calendar ------------------------------ */
function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Calendar({ initial, bookings, notify }: { initial: string[]; bookings: StoredBooking[]; notify: Notify }) {
  const [blocked, setBlocked] = useState(new Set(initial));
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [busy, setBusy] = useState(false);
  const booked = new Map(bookings.filter((b) => b.status !== "rejected").map((b) => [b.date, b]));
  const today = iso(new Date());
  const first = (month.getDay() + 6) % 7; // Monday first
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];

  async function toggle(date: string) {
    const next = new Set(blocked);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setBusy(true);
    try {
      setBlocked(new Set(await api<string[]>("/api/admin/blocked", "PUT", [...next])));
    } catch (e) {
      notify(false, (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl rounded-2xl glass p-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-full border border-cream/15 px-3 py-1">
          Prev
        </button>
        <div className="font-display text-2xl">{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-full border border-cream/15 px-3 py-1">
          Next
        </button>
      </div>
      <div className="mt-6 grid grid-cols-7 gap-1.5 text-center text-xs">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="pb-1 text-cream/40">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const k = iso(d);
          const b = booked.get(k);
          const isBlocked = blocked.has(k);
          const past = k < today;
          return (
            <button
              key={k}
              disabled={past || busy}
              onClick={() => toggle(k)}
              title={b ? `${b.status}: ${b.name}, ${b.guests} guests` : isBlocked ? "Blocked, tap to open" : "Tap to block"}
              className={`aspect-square rounded-xl text-sm transition ${past ? "text-cream/20" : b?.status === "confirmed" ? "bg-[#25D366]/25 text-[#25D366]" : isBlocked ? "bg-ember/30 text-ember line-through" : b ? "bg-saffron/20 text-saffron" : "hover:bg-cream/10"}`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-cream/60">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-[#25D366]/40" /> Confirmed
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-saffron/40" /> Pending request
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-ember/40" /> Blocked (not bookable)
        </span>
      </div>
      <p className="mt-3 text-xs text-cream/40">Tap any future date to block or unblock it. Blocked dates cannot be booked on the website or by the AI.</p>
    </div>
  );
}
