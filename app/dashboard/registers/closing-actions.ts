"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth";
import { getD1 } from "@/lib/db";

type RegisterRow = {
  id: string;
  cashier_id: string;
  opened_at: number;
  closed_at: number | null;
  opening_cents: number;
  expected_cents: number | null;
  actual_cents: number | null;
  difference_cents: number | null;
  denominations_json: string | null;
  difference_reason: string | null;
  note: string | null;
  status: string;
};

type CashMovementSummary = {
  cash_sales: number;
  debt_received: number;
  purchases: number;
  supplier_payments: number;
  expenses: number;
  refunds: number;
  manual_in: number;
  manual_out: number;
};

type SaleSummary = {
  sales: number;
  credit_sales: number;
  gross_profit: number;
};

type ReturnSummary = {
  count: number;
};

export async function generateClosing(registerId: string) {
  const actor = await requirePermission("reports.cash");
  const db = await getD1();
  const register = await db
    .prepare("SELECT * FROM cash_registers WHERE id=?")
    .bind(registerId)
    .first<RegisterRow>();

  if (!register) throw new Error("Caisse introuvable");

  const existing = await db
    .prepare("SELECT id FROM daily_closings WHERE register_id=?")
    .bind(registerId)
    .first<{ id: string }>();
  if (existing) throw new Error("Rapport déjà généré");

  const movement = await db
    .prepare(
      "SELECT COALESCE(sum(CASE WHEN type='sale' THEN amount_cents ELSE 0 END),0) cash_sales,COALESCE(sum(CASE WHEN type='credit_payment' THEN amount_cents ELSE 0 END),0) debt_received,COALESCE(sum(CASE WHEN type='purchase' THEN amount_cents ELSE 0 END),0) purchases,COALESCE(sum(CASE WHEN reference_type='supplier_payment' THEN amount_cents ELSE 0 END),0) supplier_payments,COALESCE(sum(CASE WHEN type='expense' THEN amount_cents ELSE 0 END),0) expenses,COALESCE(sum(CASE WHEN type='refund' THEN amount_cents ELSE 0 END),0) refunds,COALESCE(sum(CASE WHEN type='cash_in' THEN amount_cents ELSE 0 END),0) manual_in,COALESCE(sum(CASE WHEN type='cash_out' AND reference_type<>'supplier_payment' THEN amount_cents ELSE 0 END),0) manual_out FROM cash_movements WHERE register_id=?",
    )
    .bind(registerId)
    .first<CashMovementSummary>();
  const sales = await db
    .prepare(
      "SELECT count(*) sales,COALESCE(sum(credit_cents),0) credit_sales,COALESCE(sum((si.unit_price_cents-si.purchase_price_cents)*si.quantity),0) gross_profit FROM sales s LEFT JOIN sale_items si ON si.sale_id=s.id WHERE s.register_id=?",
    )
    .bind(registerId)
    .first<SaleSummary>();
  const returned = await db
    .prepare("SELECT count(*) count FROM returns WHERE register_id=?")
    .bind(registerId)
    .first<ReturnSummary>();
  const report = {
    ...register,
    ...movement,
    ...sales,
    returned: returned?.count ?? 0,
  };
  const now = Math.floor(Date.now() / 1000);
  const date = new Date(register.opened_at * 1000).toISOString().slice(0, 10);

  await db.batch([
    db
      .prepare(
        "INSERT INTO daily_closings(id,business_date,register_id,report_json,created_by,created_at) VALUES(?,?,?,?,?,?)",
      )
      .bind(
        crypto.randomUUID(),
        date,
        registerId,
        JSON.stringify(report),
        actor.user.id,
        now,
      ),
    db
      .prepare(
        "INSERT INTO audit_logs(id,user_id,action,entity_type,entity_id,details_json,created_at) VALUES(?,?,?,?,?,?,?)",
      )
      .bind(
        crypto.randomUUID(),
        actor.user.id,
        "closing.generate",
        "register",
        registerId,
        null,
        now,
      ),
  ]);
  revalidatePath(`/dashboard/registers/${registerId}/closing-report`);
}
