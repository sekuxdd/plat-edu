"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StudentTestRunner } from "@/components/student-test-runner";

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

type StudentMaterialPageProps = {
  materialId: string;
};

function wordsFromContent(content: string) {
  return content
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function StudentMaterialPage({ materialId }: StudentMaterialPageProps) {
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);

  useEffect(() => {
    void loadOverview();
  }, []);

  async function loadOverview() {
    setLoading(true);
    setMessage(null);

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

  const tests = useMemo(
    () =>
      overview?.tests.filter(
        (item) => item.published && item.topic.chapter.title.toLowerCase().includes("angielski"),
      ) ?? [],
    [overview],
  );

  const selectedMaterial = useMemo(
    () => materials.find((item) => item.id === materialId) ?? null,
    [materialId, materials],
  );

  useEffect(() => {
    if (!selectedMaterial) {
      return;
    }

    setOpenTopicId(selectedMaterial.topic.id);
  }, [selectedMaterial]);

  function toggleTopic(topicId: string) {
    setOpenTopicId((current) => (current === topicId ? null : topicId));
  }

  const testsByTopic = useMemo(() => {
    return tests.reduce<Record<string, typeof tests>>((accumulator, item) => {
      if (!accumulator[item.topic.id]) {
        accumulator[item.topic.id] = [];
      }

      accumulator[item.topic.id].push(item);
      return accumulator;
    }, {});
  }, [tests]);

  const materialsByTopic = useMemo(() => {
    return materials.reduce<Record<string, typeof materials>>((accumulator, item) => {
      if (!accumulator[item.topic.id]) {
        accumulator[item.topic.id] = [];
      }

      accumulator[item.topic.id].push(item);
      return accumulator;
    }, {});
  }, [materials]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">Nauka materiału</h1>
        <Link href="/student" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:border-slate-400">
          Wróć do panelu
        </Link>
      </div>

      {message ? <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:h-fit">
          <h2 className="text-lg font-bold text-slate-950">Nawigacja materiałów</h2>

          {!englishChapter ? (
            <p className="mt-4 text-sm text-slate-500">Brak tematów do wyświetlenia.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {englishChapter.topics.map((topic) => {
                const topicMaterials = materialsByTopic[topic.id] ?? [];
                const topicTests = testsByTopic[topic.id] ?? [];
                const isOpen = openTopicId === topic.id;

                return (
                  <div key={topic.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <button
                      type="button"
                      onClick={() => toggleTopic(topic.id)}
                      className="flex w-full items-center justify-between gap-2 text-left"
                    >
                      <span className="font-semibold text-slate-900">{topic.title}</span>
                      <span className="text-sm font-semibold text-slate-500">{isOpen ? "v" : ">"}</span>
                    </button>

                    {isOpen ? (
                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Podtematy i materiały</p>
                          <div className="space-y-1">
                            {topicMaterials.length ? (
                              topicMaterials.map((material) => (
                                <Link
                                  key={material.id}
                                  href={`/student/material/${material.id}`}
                                  className={`block rounded-xl px-3 py-2 text-sm font-semibold transition ${
                                    material.id === materialId
                                      ? "bg-slate-950 text-white"
                                      : "bg-white text-slate-800 hover:bg-slate-100"
                                  }`}
                                >
                                  {material.title}
                                </Link>
                              ))
                            ) : (
                              <p className="rounded-xl bg-white px-3 py-2 text-sm text-slate-500">Brak materiałów.</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Sprawdziany</p>
                          <div className="space-y-1">
                            {topicTests.length ? (
                              topicTests.map((test) => (
                                <button
                                  key={test.id}
                                  type="button"
                                  onClick={() => setActiveTestId(test.id)}
                                  className="block w-full rounded-xl bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                                >
                                  {test.title}
                                </button>
                              ))
                            ) : (
                              <p className="rounded-xl bg-white px-3 py-2 text-sm text-slate-500">Brak testów.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        <main className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          {loading ? <p className="text-sm text-slate-500">Ładowanie materiału...</p> : null}

          {!loading && selectedMaterial ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {selectedMaterial.topic.chapter.title} / {selectedMaterial.topic.title}
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{selectedMaterial.title}</h2>
              <p className="mt-2 text-sm text-slate-500">Typ: {selectedMaterial.type}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {wordsFromContent(selectedMaterial.content).map((word) => (
                  <span key={word} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {!loading && !selectedMaterial ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Nie znaleziono materiału. Wybierz inny materiał z menu po lewej.
            </div>
          ) : null}
        </main>
      </div>

      {activeTestId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <StudentTestRunner testId={activeTestId} mode="modal" onClose={() => setActiveTestId(null)} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
