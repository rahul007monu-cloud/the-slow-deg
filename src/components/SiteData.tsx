"use client";

import { createContext, useContext } from "react";
import type { Dish, Settings } from "@/lib/types";

/** Public, admin-editable data. notifyEmail is stripped on the server before it reaches the browser. */
export type PublicSettings = Omit<Settings, "notifyEmail">;
type SiteData = { settings: PublicSettings; menu: Dish[] };

const Ctx = createContext<SiteData | null>(null);

export function SiteDataProvider({ value, children }: { value: SiteData; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSite must be used inside SiteDataProvider");
  return v;
}

export function useWhatsApp() {
  const { settings } = useSite();
  return (text: string) => `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
