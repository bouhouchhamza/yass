import Link from "next/link";

import { requirePermission } from "@/lib/auth";
import { getD1 } from "@/lib/db";

type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  active: number;
  created_at: number;
  products: number;
};

export default async function Page() {
  await requirePermission("products.view");

  const db = await getD1();
  const queryResult = await db
    .prepare(
      "SELECT c.*,count(p.id) products FROM categories c LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id ORDER BY c.name LIMIT 50",
    )
    .all<CategoryRow>();
  const rows: CategoryRow[] = queryResult.results;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-black">Catégories</h1>
        <Link className="btn btn-primary" href="/dashboard/categories/new">
          Nouvelle
        </Link>
      </div>
      <section className="card">
        {rows.map((category: CategoryRow) => (
          <div
            className="flex justify-between border-b p-4"
            key={category.id}
          >
            <span>
              <b>{category.name}</b>
              <p>
                {category.products} produit(s) ·{" "}
                {category.active ? "Active" : "Inactive"}
              </p>
            </span>
            <Link href={`/dashboard/categories/${category.id}/edit`}>
              Modifier
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
