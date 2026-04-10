"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ChapterTopic = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  materials: Array<{ id: string }>;
  tests: Array<{ id: string }>;
};

type ChapterItem = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  topics: ChapterTopic[];
};

type TopicItem = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  chapter: { id: string; title: string };
  materials: Array<{ id: string }>;
  tests: Array<{ id: string }>;
};

type MaterialItem = {
  id: string;
  title: string;
  type: string;
  content: string;
  order: number;
  published: boolean;
  topic: { id: string; title: string; chapter: { id: string; title: string } };
};

type TestItem = {
  id: string;
  title: string;
  questionCount: number;
  answerMode: "text" | "abcd";
  status: string;
  content: string;
  order: number;
  published: boolean;
  topic: { id: string; title: string; chapter: { id: string; title: string } };
};

type Overview = {
  chapters: ChapterItem[];
  materials: MaterialItem[];
  tests: TestItem[];
};

type ChapterForm = {
  title: string;
  description: string;
  order: string;
};

type TopicForm = {
  chapterId: string;
  title: string;
  description: string;
  order: string;
};

type MaterialForm = {
  topicId: string;
  title: string;
  type: string;
  content: string;
  order: string;
  published: boolean;
};

const emptyChapterForm: ChapterForm = {
  title: "",
  description: "",
  order: "0",
};

const emptyTopicForm: TopicForm = {
  chapterId: "",
  title: "",
  description: "",
  order: "0",
};

const emptyMaterialForm: MaterialForm = {
  topicId: "",
  title: "",
  type: "PDF",
  content: "",
  order: "0",
  published: true,
};

export function TeacherDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [chapterForm, setChapterForm] = useState<ChapterForm>(emptyChapterForm);
  const [topicForm, setTopicForm] = useState<TopicForm>(emptyTopicForm);
  const [materialForm, setMaterialForm] = useState<MaterialForm>(emptyMaterialForm);

  const allTopics = useMemo(
    () => overview?.chapters.flatMap((chapter) => chapter.topics.map((topic) => ({ ...topic, chapter }))) ?? [],
    [overview],
  );

  const metrics = useMemo(
    () => [
      { label: "Rozdziały", value: overview?.chapters.length ?? 0 },
      { label: "Tematy", value: allTopics.length },
      { label: "Materiały", value: overview?.materials.length ?? 0 },
      { label: "Testy", value: overview?.tests.length ?? 0 },
    ],
    [allTopics.length, overview],
  );

  useEffect(() => {
    void loadOverview();
  }, []);

  async function loadOverview() {
    setLoading(true);

    try {
      const response = await fetch("/api/overview", { credentials: "include" });

      if (!response.ok) {
        setStatusMessage("Nie udało się pobrać danych.");
        return;
      }

      const data = (await response.json()) as Overview;
      setOverview(data);

      setTopicForm((current) => ({
        ...current,
        chapterId: current.chapterId || data.chapters[0]?.id || "",
      }));
      setMaterialForm((current) => ({
        ...current,
        topicId: current.topicId || data.chapters[0]?.topics[0]?.id || "",
      }));
    } catch {
      setStatusMessage("Wystąpił problem podczas pobierania danych.");
    } finally {
      setLoading(false);
    }
  }

  async function mutate(endpoint: string, method: "POST" | "PUT" | "DELETE", body?: unknown) {
    const response = await fetch(endpoint, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error ?? "Operacja nie powiodła się.");
    }
  }

  async function submitChapter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await mutate(editingChapterId ? `/api/chapters/${editingChapterId}` : "/api/chapters", editingChapterId ? "PUT" : "POST", {
        title: chapterForm.title,
        description: chapterForm.description,
        order: Number(chapterForm.order),
      });
      setStatusMessage(editingChapterId ? "Rozdział zaktualizowany." : "Rozdział dodany.");
      setEditingChapterId(null);
      setChapterForm(emptyChapterForm);
      await loadOverview();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Nie udało się zapisać rozdziału.");
    }
  }

  async function submitTopic(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await mutate(editingTopicId ? `/api/topics/${editingTopicId}` : "/api/topics", editingTopicId ? "PUT" : "POST", {
        chapterId: topicForm.chapterId,
        title: topicForm.title,
        description: topicForm.description,
        order: Number(topicForm.order),
      });
      setStatusMessage(editingTopicId ? "Temat zaktualizowany." : "Temat dodany.");
      setEditingTopicId(null);
      setTopicForm((current) => ({ ...emptyTopicForm, chapterId: current.chapterId || overview?.chapters[0]?.id || "" }));
      await loadOverview();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Nie udało się zapisać tematu.");
    }
  }

  async function submitMaterial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await mutate(editingMaterialId ? `/api/materials/${editingMaterialId}` : "/api/materials", editingMaterialId ? "PUT" : "POST", {
        topicId: materialForm.topicId,
        title: materialForm.title,
        type: materialForm.type,
        content: materialForm.content,
        order: Number(materialForm.order),
        published: materialForm.published,
      });
      setStatusMessage(editingMaterialId ? "Materiał zaktualizowany." : "Materiał dodany.");
      setEditingMaterialId(null);
      setMaterialForm((current) => ({ ...emptyMaterialForm, topicId: current.topicId || allTopics[0]?.id || "" }));
      await loadOverview();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Nie udało się zapisać materiału.");
    }
  }

  async function removeResource(endpoint: string, label: string) {
    if (!window.confirm(`Usunąć ${label}?`)) {
      return;
    }

    try {
      await mutate(endpoint, "DELETE");
      setStatusMessage(`${label} usunięty.`);
      await loadOverview();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : `Nie udało się usunąć ${label}.`);
    }
  }

  function editChapter(chapter: ChapterItem) {
    setEditingChapterId(chapter.id);
    setChapterForm({
      title: chapter.title,
      description: chapter.description ?? "",
      order: String(chapter.order),
    });
  }

  function editTopic(topic: TopicItem) {
    setEditingTopicId(topic.id);
    setTopicForm({
      chapterId: topic.chapter.id,
      title: topic.title,
      description: topic.description ?? "",
      order: String(topic.order),
    });
  }

  function editMaterial(material: MaterialItem) {
    setEditingMaterialId(material.id);
    setMaterialForm({
      topicId: material.topic.id,
      title: material.title,
      type: material.type,
      content: material.content,
      order: String(material.order),
      published: material.published,
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
            Panel nauczyciela
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Zarządzaj rozdziałami, tematami, materiałami i testami.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Dodawanie, edycja i usuwanie treści zapisuje dane w bazie przez API Next.js.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-3xl font-black text-slate-950">{metric.value}</p>
              <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>

      {statusMessage ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          {statusMessage}
        </div>
      ) : null}

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <form onSubmit={submitChapter} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-950">Rozdziały</h2>
            {editingChapterId ? (
              <button type="button" className="text-sm font-semibold text-slate-500 hover:text-slate-950" onClick={() => { setEditingChapterId(null); setChapterForm(emptyChapterForm); }}>
                Anuluj edycję
              </button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3">
            <input value={chapterForm.title} onChange={(event) => setChapterForm((current) => ({ ...current, title: event.target.value }))} placeholder="Nazwa rozdziału" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
            <textarea value={chapterForm.description} onChange={(event) => setChapterForm((current) => ({ ...current, description: event.target.value }))} placeholder="Opis rozdziału" rows={3} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
            <input value={chapterForm.order} onChange={(event) => setChapterForm((current) => ({ ...current, order: event.target.value }))} type="number" min="0" placeholder="Kolejność" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
            <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white">
              {editingChapterId ? "Zapisz zmiany" : "Dodaj rozdział"}
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {overview?.chapters.map((chapter) => (
              <article key={chapter.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{chapter.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{chapter.description ?? "Brak opisu"}</p>
                    <p className="mt-1 text-xs text-slate-400">{chapter.topics.length} tematów</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editChapter(chapter)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      Edytuj
                    </button>
                    <button type="button" onClick={() => void removeResource(`/api/chapters/${chapter.id}`, `rozdział ${chapter.title}`)} className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                      Usuń
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </form>

        <form onSubmit={submitTopic} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-950">Tematy</h2>
            {editingTopicId ? (
              <button type="button" className="text-sm font-semibold text-slate-500 hover:text-slate-950" onClick={() => { setEditingTopicId(null); setTopicForm((current) => ({ ...emptyTopicForm, chapterId: current.chapterId || overview?.chapters[0]?.id || "" })); }}>
                Anuluj edycję
              </button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3">
            <select value={topicForm.chapterId} onChange={(event) => setTopicForm((current) => ({ ...current, chapterId: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none">
              <option value="">Wybierz rozdział</option>
              {overview?.chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.title}
                </option>
              ))}
            </select>
            <input value={topicForm.title} onChange={(event) => setTopicForm((current) => ({ ...current, title: event.target.value }))} placeholder="Nazwa tematu" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
            <textarea value={topicForm.description} onChange={(event) => setTopicForm((current) => ({ ...current, description: event.target.value }))} placeholder="Opis tematu" rows={3} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
            <input value={topicForm.order} onChange={(event) => setTopicForm((current) => ({ ...current, order: event.target.value }))} type="number" min="0" placeholder="Kolejność" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
            <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white">
              {editingTopicId ? "Zapisz zmiany" : "Dodaj temat"}
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {allTopics.map((topic) => (
              <article key={topic.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{topic.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{topic.chapter.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{topic.materials.length} materiałów · {topic.tests.length} testów</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editTopic(topic)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      Edytuj
                    </button>
                    <button type="button" onClick={() => void removeResource(`/api/topics/${topic.id}`, `temat ${topic.title}`)} className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                      Usuń
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </form>

        <form onSubmit={submitMaterial} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-950">Materiały</h2>
            {editingMaterialId ? (
              <button type="button" className="text-sm font-semibold text-slate-500 hover:text-slate-950" onClick={() => { setEditingMaterialId(null); setMaterialForm((current) => ({ ...emptyMaterialForm, topicId: current.topicId || allTopics[0]?.id || "" })); }}>
                Anuluj edycję
              </button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3">
            <select value={materialForm.topicId} onChange={(event) => setMaterialForm((current) => ({ ...current, topicId: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none">
              <option value="">Wybierz temat</option>
              {allTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.chapter.title} / {topic.title}
                </option>
              ))}
            </select>
            <input value={materialForm.title} onChange={(event) => setMaterialForm((current) => ({ ...current, title: event.target.value }))} placeholder="Tytuł materiału" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
            <input value={materialForm.type} onChange={(event) => setMaterialForm((current) => ({ ...current, type: event.target.value }))} placeholder="Typ pliku lub treści" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
            <textarea value={materialForm.content} onChange={(event) => setMaterialForm((current) => ({ ...current, content: event.target.value }))} placeholder="Opis materiału" rows={3} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
            <input value={materialForm.order} onChange={(event) => setMaterialForm((current) => ({ ...current, order: event.target.value }))} type="number" min="0" placeholder="Kolejność" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input checked={materialForm.published} onChange={(event) => setMaterialForm((current) => ({ ...current, published: event.target.checked }))} type="checkbox" />
              Opublikowany materiał
            </label>
            <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white">
              {editingMaterialId ? "Zapisz zmiany" : "Dodaj materiał"}
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {overview?.materials.map((material) => (
              <article key={material.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{material.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{material.topic.chapter.title} / {material.topic.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{material.type} · {material.published ? "opublikowany" : "roboczy"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editMaterial(material)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      Edytuj
                    </button>
                    <button type="button" onClick={() => void removeResource(`/api/materials/${material.id}`, `materiał ${material.title}`)} className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                      Usuń
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </form>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Testy</h2>
              <p className="mt-2 text-sm text-slate-500">Tworzenie i edycja testów odbywa się teraz na osobnej stronie, żeby nie nakładać paneli.</p>
            </div>
            <Link href="/teacher/tests/new" className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950">
              Nowy test
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {overview?.tests.map((test) => (
              <article key={test.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{test.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{test.topic.chapter.title} / {test.topic.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{test.questionCount} pytań · {test.answerMode === "abcd" ? "ABCD" : "wpisywanie"} · {test.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/teacher/tests/${test.id}`} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      Edytuj
                    </Link>
                    <button type="button" onClick={() => void removeResource(`/api/tests/${test.id}`, `test ${test.title}`)} className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                      Usuń
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {loading ? <p className="mt-6 text-sm text-slate-500">Ładowanie danych...</p> : null}
    </section>
  );
}
