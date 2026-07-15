import { DebouncedSearch } from "@/components/debounced-search";
import { Pagination } from "@/components/pagination";
import { requirePermission } from "@/lib/auth";
import { getD1 } from "@/lib/db";
import { money } from "@/lib/utils";

import { CustomerForm, PaymentForm } from "./customer-forms";

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  credit_limit_cents: number;
  debt_cents: number;
};

type CustomerSearchParams = {
  q?: string;
  page?: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<CustomerSearchParams>;
}) {
  await requirePermission("customers.view");

  const search = await searchParams;
  const query = (search.q ?? "").trim();
  const page = Math.max(1, Number(search.page) || 1);
  const limit = 20;
  const db = await getD1();
  const result = await db
    .prepare(
      "SELECT id,name,phone,credit_limit_cents,debt_cents FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name LIMIT ? OFFSET ?",
    )
    .bind(
      `%${query}%`,
      `%${query}%`,
      limit + 1,
      (page - 1) * limit,
    )
    .all<CustomerRow>();
  const rows: CustomerRow[] = result.results ?? [];
  const more = rows.length > limit;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <h1 className="text-3xl font-black">Clients et crédits</h1>
      <DebouncedSearch initial={query} placeholder="Nom ou téléphone" />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="card">
          <table className="w-full text-left">
            <tbody>
              {rows.slice(0, limit).map((customer: CustomerRow) => (
                <tr className="border-b" key={customer.id}>
                  <td className="p-4">
                    <b>{customer.name}</b>
                    <p>{customer.phone}</p>
                  </td>
                  <td>{money(customer.debt_cents)}</td>
                  <td>
                    {customer.debt_cents > 0 ? (
                      <PaymentForm
                        customerId={customer.id}
                        debt={customer.debt_cents / 100}
                      />
                    ) : (
                      "Soldé"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            more={more}
            query={`q=${encodeURIComponent(query)}`}
          />
        </section>
        <aside className="card h-fit p-5">
          <h2 className="mb-4 font-black">Nouveau client</h2>
          <CustomerForm />
        </aside>
      </div>
    </div>
  );
}
