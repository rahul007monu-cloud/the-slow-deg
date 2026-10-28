import { z } from "zod";

export const bookingSchema = z.object({
  // event
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
  hours: z.number().int().min(1).max(24),
  openEnded: z.boolean(),
  guests: z.number().int().min(10, "Minimum 10 guests").max(5000),
  occasion: z.string().trim().min(1).max(80),
  city: z.string().trim().min(2, "Enter the city").max(80),
  venue: z.string().trim().max(200).optional().default(""),
  // pricing
  model: z.enum(["package", "hourly", "plate"]),
  plateTierId: z.string().max(40),
  addOnIds: z.array(z.string().max(40)).max(20),
  dishIds: z.array(z.string().max(40)).max(20),
  notes: z.string().trim().max(1000).optional().default(""),
  // contact
  name: z.string().trim().min(2, "Enter your name").max(100),
  company: z.string().trim().min(2, "Enter your company").max(120),
  email: z.email("Enter a valid email").max(200),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{7,16}$/, "Enter a valid phone number"),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^$|^[0-9]{2}[A-Z0-9]{13}$/, "GSTIN should be 15 characters")
    .optional()
    .default(""),
  // spam trap: real users never fill this
  website: z.string().max(0).optional().default(""),
});

export type BookingInput = z.input<typeof bookingSchema>;
export type Booking = z.output<typeof bookingSchema>;
