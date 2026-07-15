import { z } from "zod";

export const saleSchema = z.object({
  idempotencyKey: z.string().uuid(),
  customerId: z.string().uuid().nullable(),
  paymentType: z.enum(["cash", "credit", "partial_cash_credit"]),
  cashReceived: z.number().int().min(0),
  discountAmount: z.number().int().min(0).default(0),
  notes: z.string().max(500).optional(),
  items: z.array(z.object({
    productId: z.string().min(1), quantity: z.number().int().positive(), unitPrice: z.number().int().min(0), discountAmount: z.number().int().min(0),
  })).min(1),
}).superRefine((v, ctx) => {
  if (v.paymentType !== "cash" && !v.customerId) ctx.addIssue({ code: "custom", path: ["customerId"], message: "Un client est obligatoire pour une vente à crédit" });
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(160), sku: z.string().trim().min(1).max(80),
  product_type: z.enum(["physical_product", "service"]), purchase_price: z.coerce.number().min(0),
  selling_price: z.coerce.number().min(0), wholesale_price: z.coerce.number().min(0).nullable(),
  current_stock: z.coerce.number().min(0), minimum_stock: z.coerce.number().min(0),
});
