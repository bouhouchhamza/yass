import { BookOpen } from "lucide-react";
import { LoginForm } from "./login-form";

export default async function Login({ searchParams }: { searchParams: Promise<Record<string,string>> }) {
  const q = await searchParams;
  return <main className="grid min-h-screen lg:grid-cols-[1.1fr_.9fr]">
    <section className="hidden bg-[#123d2b] p-14 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-3 text-xl font-black"><span className="grid size-11 place-items-center rounded-xl bg-white/10"><BookOpen /></span>Maktaba Gestion</div>
      <div><p className="mb-4 text-sm font-bold uppercase tracking-[.2em] text-emerald-300">Votre commerce, en temps réel</p><h1 className="max-w-xl text-5xl font-black leading-tight">Une caisse claire.<br/>Un stock juste.<br/>Une gestion sereine.</h1><p className="mt-6 max-w-lg text-lg text-emerald-50/70">Pensé pour les librairies et papeteries marocaines. Paiements en espèces, crédit client et contrôle de caisse.</p></div>
      <p className="text-sm text-white/45">Cloudflare D1 · Better Auth · Paiements en espèces</p>
    </section>
    <section className="grid place-items-center bg-white p-6"><div className="w-full max-w-sm">
      <div className="mb-8 grid size-12 place-items-center rounded-xl bg-emerald-50 text-emerald-700 lg:hidden"><BookOpen /></div>
      <h2 className="text-3xl font-black">Bon retour</h2><p className="mt-2 text-gray-500">Connectez-vous à votre espace de gestion.</p>
      {q.error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{q.error}</p>}
      {q.message && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{q.message}</p>}
      <LoginForm/>
    </div></section>
  </main>;
}
