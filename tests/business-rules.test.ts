import { describe,expect,it } from "vitest";
import { formatInternalBarcode } from "@/lib/barcode";
import { saleSchema } from "@/lib/validation";

const item={productId:"00000000-0000-4000-8000-000000000001",quantity:1,unitPrice:10,discountAmount:0};
describe("cash-only sale rules",()=>{
 it("formats unique sortable Code 128 values",()=>expect(formatInternalBarcode("mkt",42)).toBe("MKT-000042"));
 it("supports a cash sale",()=>expect(saleSchema.parse({idempotencyKey:crypto.randomUUID(),customerId:null,paymentType:"cash",cashReceived:10,items:[item]}).paymentType).toBe("cash"));
 it("rejects anonymous credit",()=>expect(()=>saleSchema.parse({idempotencyKey:crypto.randomUUID(),customerId:null,paymentType:"credit",cashReceived:0,items:[item]})).toThrow(/client/i));
 it("rejects negative discounts",()=>expect(()=>saleSchema.parse({idempotencyKey:crypto.randomUUID(),customerId:null,paymentType:"cash",cashReceived:10,items:[{...item,discountAmount:-1}]})).toThrow());
 it("rejects an empty cart",()=>expect(()=>saleSchema.parse({idempotencyKey:crypto.randomUUID(),customerId:null,paymentType:"cash",cashReceived:0,items:[]})).toThrow());
});
