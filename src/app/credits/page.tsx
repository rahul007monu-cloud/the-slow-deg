import type { Metadata } from "next";
import { tandoorPhoto } from "@/lib/defaults";
import { getMenu } from "@/lib/store";

export const metadata: Metadata = { title: "Photo credits · The Slow Deg" };
export const revalidate = 3600;

export default async function Credits() {
  const menu = await getMenu();
  const credits = [...menu.filter((d) => d.photoCredit).map((d) => ({ name: d.name, photo: d.photo, credit: d.photoCredit })), { name: "Tandoor", photo: tandoorPhoto.src, credit: tandoorPhoto.credit }];
  return (
    <main className="mx-auto max-w-3xl px-5 py-24 text-cream">
      <a href="/" className="text-sm text-saffron">
        Back to the site
      </a>
      <h1 className="mt-6 font-display text-5xl">Photo credits</h1>
      <p className="mt-4 text-cream/60">
        Some photos on this site are used under Creative Commons licences from Wikimedia Commons. Photos may be cropped or colour-graded. Licence details:{" "}
        <a className="underline" href="https://creativecommons.org/licenses/" rel="noopener" target="_blank">
          creativecommons.org/licenses
        </a>
        .
      </p>
      <ul className="mt-10 space-y-4">
        {credits.map((c) => (
          <li key={c.photo} className="flex items-center gap-4 rounded-2xl border border-cream/10 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.photo} alt="" className="h-16 w-16 rounded-xl object-cover" />
            <div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm text-cream/60">{c.credit}</div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
