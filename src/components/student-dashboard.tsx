"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type StudentOverview = {
  chapters: Array<{
    id: string;
    title: string;
    description: string | null;
    topics: Array<{
      id: string;
      title: string;
      description: string | null;
      materials: Array<{ id: string }>;
      tests: Array<{ id: string }>;
    }>;
  }>;
  materials: Array<{
    id: string;
    title: string;
    type: string;
    content: string;
    published: boolean;
    topic: { id: string; title: string; chapter: { id: string; title: string } };
  }>;
  tests: Array<{
    id: string;
    title: string;
    questionCount: number;
    status: string;
    content: string;
    published: boolean;
    topic: { id: string; title: string; chapter: { id: string; title: string } };
  }>;
};

export function StudentDashboard() {
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadOverview();
  }, []);

  async function loadOverview() {
    setLoading(true);

    try {
      const response = await fetch("/api/overview", { credentials: "include" });

      if (!response.ok) {
        setMessage("Nie udało się pobrać materiałów.");
        return;
      }

      const data = (await response.json()) as StudentOverview;
      setOverview(data);
    } catch {
      setMessage("Wystąpił problem podczas pobierania materiałów.");
    } finally {
      setLoading(false);
    }
  }

  const englishChapter = useMemo(
    () => overview?.chapters.find((chapter) => chapter.title.toLowerCase().includes("angielski")) ?? null,
    [overview],
  );

  const materials = useMemo(
    () =>
      overview?.materials.filter(
        (item) => item.published && item.topic.chapter.title.toLowerCase().includes("angielski"),
      ) ?? [],
    [overview],
  );

  const metrics = useMemo(
    () => [{ label: "Materiały", value: materials.length }],
    [materials.length],
  );

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <div className="max-w-3xl">
        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
          Panel ucznia
        </span>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Nauka z języka angielskiego</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Kliknij materiał, aby przejść do nowej strony z nawigacją po tematach.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-1">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-3xl font-black text-slate-950">{metric.value}</p>
            <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
          </div>
        ))}
      </div>

      {message ? <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</div> : null}

      {!englishChapter ? (
        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Brak tematów z języka angielskiego w bazie.
        </div>
      ) : (
        <div className="mt-10 grid gap-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Materiały do nauki</h2>
            <div className="mt-4 space-y-4">
              {materials.map((material) => (
                <Link
                  key={material.id}
                  href={`/student/material/${material.id}`}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-slate-950 transition hover:border-slate-300"
                >
                  <p className="font-semibold">{material.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {material.topic.chapter.title} / {material.topic.title}
                  </p>
                </Link>
              ))}
            </div>
            <p className="mt-6 text-sm text-slate-500">Po kliknięciu otworzy się nowa strona materiału z lewą nawigacją po tematach i testach.</p>
          </div>
        </div>
      )}

      {loading ? <p className="mt-6 text-sm text-slate-500">Ładowanie danych...</p> : null}
    </section>
  );
}

