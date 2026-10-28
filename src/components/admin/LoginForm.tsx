"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Login failed");
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,90,31,0.25),transparent_60%)]" />
      <form onSubmit={submit} className="relative w-full max-w-sm rounded-[2rem] glass p-8">
        <div className="font-deva text-4xl text-gradient-ember">उस्ताद</div>
        <h1 className="mt-2 font-display text-3xl text-cream">Chef’s admin</h1>
        <p className="mt-1 text-sm text-cream/50">Bookings, price and menu for The Slow Deg.</p>

        {!configured && (
          <p className="mt-6 rounded-xl border border-saffron/40 bg-saffron/10 p-3 text-xs text-cream/80">
            Login is not set up yet. In Vercel open Settings → Environment Variables, add <b>ADMIN_EMAIL</b> and <b>ADMIN_PASSWORD</b>, then redeploy.
          </p>
        )}

        <label className="mt-8 block text-sm text-cream/70">
          Email
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-cream/15 bg-coal/60 px-4 py-3 text-cream outline-none focus:border-saffron" />
        </label>
        <label className="mt-4 block text-sm text-cream/70">
          Password
          <div className="relative mt-2">
            <input type={show ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-cream/15 bg-coal/60 px-4 py-3 pr-16 text-cream outline-none focus:border-saffron" />
            <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-cream/50 hover:text-saffron">
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        {error && <p className="mt-4 text-sm text-ember">{error}</p>}
        <button disabled={busy} className="mt-8 w-full rounded-full bg-gradient-to-r from-saffron to-ember py-3.5 font-semibold text-coal transition hover:scale-[1.02] disabled:opacity-60">
          {busy ? "Opening…" : "Log in"}
        </button>
        <a href="/" className="mt-6 block text-center text-xs text-cream/40 hover:text-cream/70">
          Back to the website
        </a>
      </form>
    </main>
  );
}
