import { DebouncedSearch } from "@/components/debounced-search";
import { Pagination } from "@/components/pagination";
import { requirePermission } from "@/lib/auth";
import { getD1 } from "@/lib/db";

type AuditRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details_json: string | null;
  created_at: number;
  user_name: string | null;
};

type AuditSearchParams = {
  q?: string;
  page?: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<AuditSearchParams>;
}) {
  await requirePermission("audit.view");

  const search = await searchParams;
  const query = (search.q ?? "").trim();
  const page = Math.max(1, Number(search.page) || 1);
  const limit = 25;
  const db = await getD1();
  const queryResult = await db
    .prepare(
      "SELECT a.*,u.name user_name FROM audit_logs a LEFT JOIN user u ON u.id=a.user_id WHERE a.action LIKE ? OR a.entity_type LIKE ? OR u.name LIKE ? ORDER BY a.created_at DESC LIMIT ? OFFSET ?",
    )
    .bind(
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
      limit + 1,
      (page - 1) * limit,
    )
    .all<AuditRow>();
  const rows: AuditRow[] = queryResult.results;
  const more = rows.length > limit;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-3xl font-black">Journal d’audit</h1>
      <DebouncedSearch initial={query} />
      <section className="card">
        {rows.slice(0, limit).map((row: AuditRow) => (
          <div
            key={row.id}
            className="grid grid-cols-4 border-b p-4 text-sm"
          >
            <span>
              {new Date(row.created_at * 1000).toLocaleString("fr-MA")}
            </span>
            <b>{row.user_name}</b>
            <span>
              {row.action} · {row.entity_type}
            </span>
            <code className="truncate">{row.details_json}</code>
          </div>
        ))}
      </section>
      <Pagination
        page={page}
        more={more}
        query={`q=${encodeURIComponent(query)}`}
      />
    </div>
  );
}
