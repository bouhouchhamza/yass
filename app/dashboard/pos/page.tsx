import { requirePermission } from "@/lib/auth";
import { getD1 } from "@/lib/db";

import { PosClient } from "./pos-client";

type PosCustomerRow = {
  id: string;
  full_name: string;
  current_debt: number;
  credit_limit: number;
};

type PosProductRow = {
  id: string;
  name: string;
  sku: string;
  internal_barcode: string | null;
  manufacturer_barcode: string | null;
  selling_price: number;
  current_stock: number;
  product_type: "physical_product" | "service";
};

export const metadata = { title: "Caisse" };

export default async function PosPage() {
  await requirePermission("pos");
  const db = await getD1();

  const customerResult = await db
    .prepare(
      "SELECT id,name AS full_name,debt_cents AS current_debt,credit_limit_cents AS credit_limit FROM customers ORDER BY name LIMIT 100",
    )
    .all<PosCustomerRow>();
  const customers: PosCustomerRow[] = customerResult.results;

  const favouriteResult = await db
    .prepare(
      "SELECT id,name,sku,internal_barcode,manufacturer_barcode,selling_price_cents AS selling_price,stock AS current_stock,CASE product_type WHEN 'physical' THEN 'physical_product' ELSE 'service' END AS product_type FROM products WHERE active=1 AND favourite=1 LIMIT 24",
    )
    .all<PosProductRow>();
  const favourites: PosProductRow[] = favouriteResult.results;

  return <PosClient initialProducts={favourites} customers={customers} />;
}
