import { brand } from "@/config/business";

export function whatsappLink(text: string) {
  return `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(text)}`;
}
