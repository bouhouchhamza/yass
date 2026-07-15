export function formatInternalBarcode(prefix: string, sequence: number, year?: number) {
  const safe = prefix.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12) || "PRD";
  return `${safe}${year ? `-${year}` : ""}-${String(sequence).padStart(6, "0")}`;
}

