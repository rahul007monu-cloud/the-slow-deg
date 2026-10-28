import { z } from "zod";

/** Everything the chef can change from the admin panel. */
export const settingsSchema = z.object({
  pricePerPerson: z.number().int().min(0).max(100000),
  minGuests: z.number().int().min(1).max(5000),
  maxGuests: z.number().int().min(1).max(10000),
  gstPercent: z.number().min(0).max(50),
  advancePercent: z.number().min(0).max(100),
  minNoticeDays: z.number().int().min(0).max(60),
  priceNote: z.string().max(300),
  whatsappNumber: z.string().regex(/^\d{8,15}$/, "Digits only, with country code, e.g. 919812345678"),
  notifyEmail: z.union([z.email(), z.literal("")]),
  oneEventPerDay: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;

export const dishSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/),
  name: z.string().trim().min(1).max(80),
  hindi: z.string().trim().max(20),
  description: z.string().trim().max(400),
  category: z.enum(["grill", "deg"]),
  tag: z.string().trim().max(40), // e.g. "Cooked live" or "Slow-cooked 8 hrs"
  heat: z.number().int().min(0).max(3),
  signature: z.boolean(),
  visible: z.boolean(),
  photo: z.string().max(500), // /food/x.webp or an uploaded image URL
  photoCredit: z.string().max(300), // required by CC licences for stock photos; clear it for your own photos
});
export type Dish = z.infer<typeof dishSchema>;
export const menuSchema = z.array(dishSchema).max(60);

export type BookingStatus = "pending" | "confirmed" | "rejected";

export type StoredBooking = {
  ref: string;
  createdAt: string;
  source: "website" | "ai";
  status: BookingStatus;
  date: string;
  startTime: string;
  guests: number;
  occasion: string;
  city: string;
  venue: string;
  dishIds: string[];
  notes: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  gstin: string;
  quote: { pricePerPerson: number; subtotal: number; gst: number; total: number; advance: number };
};
