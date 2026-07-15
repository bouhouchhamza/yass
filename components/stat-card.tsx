import type { LucideIcon } from "lucide-react";
export function StatCard({ label, value, note, icon: Icon, tone="green" }: { label:string; value:string; note:string; icon:LucideIcon; tone?:"green"|"amber"|"blue"|"red" }) {
  const tones={green:"bg-emerald-50 text-emerald-700",amber:"bg-amber-50 text-amber-700",blue:"bg-blue-50 text-blue-700",red:"bg-red-50 text-red-700"};
  return <div className="card p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-gray-500">{label}</p><p className="mt-2 text-2xl font-black tracking-tight">{value}</p></div><span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}><Icon size={20}/></span></div><p className="mt-4 text-xs font-semibold text-gray-400">{note}</p></div>;
}

