import { z } from "zod";

export const bookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
  guests: z.number().int().min(1, "Enter the number of guests").max(10000),
  occasion: z.string().trim().min(1).max(80),
  city: z.string().trim().min(2, "Enter the city").max(80),
  venue: z.string().trim().max(200).optional().default(""),
  dishIds: z.array(z.string().max(40)).max(30).optional().default([]),
  notes: z.string().trim().max(1000).optional().default(""),
  name: z.string().trim().min(2, "Enter your name").max(100),
  company: z.string().trim().max(120).optional().default(""),
  email: z.union([z.email("Enter a valid email").max(200), z.literal("")]).optional().default(""),
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
  website: z.string().max(200).optional().default(""),
});

export type BookingInput = z.input<typeof bookingSchema>;
export type Booking = z.output<typeof bookingSchema>;
