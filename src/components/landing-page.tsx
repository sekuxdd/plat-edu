import Link from "next/link";
import { publicHighlights } from "@/lib/school-data";

export function LandingPage() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-14 px-6 py-16 lg:px-8 lg:py-24">
      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-8">
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
            Platforma edukacyjna dla szkoły i zajęć dodatkowych
          </span>
          <div className="space-y-5">
            <h1 className="max-w-2xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Jedna strona dla materiałów, testów i postępów uczniów.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Nauczyciel dodaje rozdziały, tematy, notatki i sprawdziany. Uczeń loguje się, uczy się według programu i rozwiązuje testy w jednym, uporządkowanym miejscu.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-950 transition hover:border-slate-400">
              Przejdź do logowania
            </Link>
            <Link href="/teacher" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-950 transition hover:border-slate-400">
              Zobacz panel nauczyciela
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="space-y-4 rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">Jak działa platforma</p>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="font-semibold">1. Strona główna</p>
                <p className="mt-2 text-white/70">Publiczny opis platformy i szybkie wejście do konta.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="font-semibold">2. Logowanie</p>
                <p className="mt-2 text-white/70">Wybór roli: uczeń lub nauczyciel.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="font-semibold">3. Panel nauczyciela</p>
                <p className="mt-2 text-white/70">Dodawanie materiałów, rozdziałów i testów.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="font-semibold">4. Panel ucznia</p>
                <p className="mt-2 text-white/70">Nauka, przegląd materiałów i rozwiązywanie testów.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {publicHighlights.map((item) => (
          <article key={item.title} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}