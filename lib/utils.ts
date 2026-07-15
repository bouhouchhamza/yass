import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD" }).format(Number(value ?? 0)/100);
export const toCents=(value:FormDataEntryValue|null)=>Math.round(Number(value??0)*100);
