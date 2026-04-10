"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type TestQuestionType = "text" | "abcd";

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
  chapters: Array<{
    id: string;
    title: string;
    topics: Array<{ id: string; title: string }>;
  }>;
};

type TestQuestionDraft = {
  id: string;
  prompt: string;
  type: TestQuestionType;
  correctAnswer: string;
  options: [string, string, string, string];
  points: number;
};

type StructuredTestContent = {
  version: 1;
  questions: Array<{
    prompt: string;
    type: TestQuestionType;
    correctAnswer: string;
    options: string[];
    points: number;
  }>;
};

type TeacherTestEditorProps = {
  testId?: string | null;
};

const emptyTestForm = {
  topicId: "",
  title: "",
  status: "Wersja robocza",
  order: "0",
  published: false,
};

function createQuestionId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptyQuestion(type: TestQuestionType = "text"): TestQuestionDraft {
  return {
    id: createQuestionId(),
    prompt: "",
    type,
    correctAnswer: "",
    options: ["", "", "", ""],
    points: 1,
  };
}

function wordsFromLegacyContent(content: string) {
  return content
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseTestQuestions(content: string): TestQuestionDraft[] {
  try {
    const parsed = JSON.parse(content) as StructuredTestContent;

    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.questions) || !parsed.questions.length) {
      throw new Error("Invalid structured content");
    }

    return parsed.questions.map((question) => {
      const baseOptions = Array.isArray(question.options) ? question.options.slice(0, 4) : [];

      while (baseOptions.length < 4) {
        baseOptions.push("");
      }

      return {
        id: createQuestionId(),
        prompt: question.prompt ?? "",
        type: question.type === "abcd" ? "abcd" : "text",
        correctAnswer: question.correctAnswer ?? "",
        options: [baseOptions[0], baseOptions[1], baseOptions[2], baseOptions[3]],
        points: Number.isFinite(question.points) && question.points > 0 ? Math.round(question.points) : 1,
      };
    });
  } catch {
    const legacyWords = wordsFromLegacyContent(content);

    if (!legacyWords.length) {
      return [createEmptyQuestion("text")];
    }

    return legacyWords.map((word) => ({
      id: createQuestionId(),
      prompt: `Wpisz poprawne słowo zaczynające się na: ${word[0]?.toUpperCase() ?? "?"}...`,
      type: "text",
      correctAnswer: word,
      options: ["", "", "", ""],
      points: 1,
    }));
  }
}

function serializeTestQuestions(questions: TestQuestionDraft[]) {
  const payload: StructuredTestContent = {
    version: 1,
    questions: questions.map((question) => ({
      prompt: question.prompt.trim(),
      type: question.type,
      correctAnswer: question.correctAnswer.trim(),
      options: question.type === "abcd" ? question.options.map((item) => item.trim()) : [],
      points: Math.max(1, Math.round(question.points)),
    })),
  };

  return JSON.stringify(payload);
}

export function TeacherTestEditor({ testId }: TeacherTestEditorProps) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(testId ?? null);
  const [testForm, setTestForm] = useState(emptyTestForm);
  const [testQuestions, setTestQuestions] = useState<TestQuestionDraft[]>([createEmptyQuestion("text")]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const allTopics = useMemo(
    () => overview?.chapters.flatMap((chapter) => chapter.topics.map((topic) => ({ ...topic, chapter }))) ?? [],
    [overview],
  );

  const activeQuestion = useMemo(
    () => testQuestions.find((question) => question.id === activeQuestionId) ?? testQuestions[0] ?? null,
    [activeQuestionId, testQuestions],
  );

  const totalTestPoints = useMemo(
    () => testQuestions.reduce((sum, question) => sum + Math.max(1, question.points), 0),
    [testQuestions],
  );

  useEffect(() => {
    void loadData();
  }, [editingId]);

  useEffect(() => {
    if (!activeQuestionId) {
      return;
    }

    questionRefs.current[activeQuestionId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeQuestionId, testQuestions.length]);

  async function loadData() {
    setLoading(true);
    setStatusMessage(null);

    try {
      const [overviewResponse, testResponse] = await Promise.all([
        fetch("/api/overview", { credentials: "include" }),
        editingId ? fetch(`/api/tests/${editingId}`, { credentials: "include" }) : Promise.resolve(null),
      ]);

      if (!overviewResponse.ok) {
        throw new Error("Nie udało się pobrać danych.");
      }

      const overviewData = (await overviewResponse.json()) as Overview;
      setOverview(overviewData);

      const defaultTopicId = overviewData.chapters[0]?.topics[0]?.id || "";

      if (editingId && testResponse) {
        if (!testResponse.ok) {
          throw new Error("Nie udało się pobrać testu.");
        }

        const testData = (await testResponse.json()) as { test: TestItem };
        setEditingId(testData.test.id);
        setTestForm({
          topicId: testData.test.topic.id,
          title: testData.test.title,
          status: testData.test.status,
          order: String(testData.test.order),
          published: testData.test.published,
        });
        const parsedQuestions = parseTestQuestions(testData.test.content);
        setTestQuestions(parsedQuestions);
        setActiveQuestionId(parsedQuestions[0]?.id ?? null);
        setShowAdvanced(true);
        return;
      }

      setTestForm((current) => ({ ...current, topicId: current.topicId || defaultTopicId }));
      const nextQuestions = [createEmptyQuestion("text")];
      setTestQuestions(nextQuestions);
      setActiveQuestionId(nextQuestions[0]?.id ?? null);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Nie udało się pobrać danych.");
    } finally {
      setLoading(false);
    }
  }

  async function mutate(endpoint: string, method: "POST" | "PUT", body: unknown) {
    const response = await fetch(endpoint, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error ?? "Operacja nie powiodła się.");
    }

    return payload as { test?: TestItem };
  }

  function scrollToQuestion(questionId: string) {
    setActiveQuestionId(questionId);
    questionRefs.current[questionId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function resetEditor() {
    setEditingId(testId ?? null);
    setTestForm((current) => ({ ...emptyTestForm, topicId: current.topicId || allTopics[0]?.id || "" }));
    const nextQuestions = [createEmptyQuestion("text")];
    setTestQuestions(nextQuestions);
    setActiveQuestionId(nextQuestions[0]?.id ?? null);
    setShowAdvanced(false);
  }

  async function submitTest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!testForm.topicId) {
      setStatusMessage("Wybierz temat dla testu.");
      return;
    }

    if (!testForm.title.trim()) {
      setStatusMessage("Podaj tytuł testu.");
      return;
    }

    if (!testQuestions.length) {
      setStatusMessage("Dodaj co najmniej jedno pytanie.");
      return;
    }

    if (!testForm.status.trim()) {
      setStatusMessage("Podaj status testu.");
      return;
    }

    for (let index = 0; index < testQuestions.length; index += 1) {
      const question = testQuestions[index];
      const label = `Pytanie ${index + 1}`;

      if (!question.prompt.trim()) {
        setStatusMessage(`${label}: wpisz treść pytania.`);
        return;
      }

      if (!question.correctAnswer.trim()) {
        setStatusMessage(`${label}: wpisz poprawną odpowiedź.`);
        return;
      }

      if (!Number.isInteger(question.points) || question.points < 1) {
        setStatusMessage(`${label}: punktacja musi być większa lub równa 1.`);
        return;
      }

      if (question.type === "abcd") {
        const optionSet = question.options.map((item) => item.trim());

        if (optionSet.some((item) => !item)) {
          setStatusMessage(`${label}: uzupełnij wszystkie 4 odpowiedzi ABCD.`);
          return;
        }

        if (!optionSet.includes(question.correctAnswer.trim())) {
          setStatusMessage(`${label}: poprawna odpowiedź musi być jedną z opcji ABCD.`);
          return;
        }
      }
    }

    const content = serializeTestQuestions(testQuestions);
    const questionCount = testQuestions.length;
    const answerMode = testQuestions.some((question) => question.type === "abcd") ? "abcd" : "text";
    const payload = {
      topicId: testForm.topicId,
      title: testForm.title,
      questionCount,
      answerMode,
      status: testForm.status,
      content,
      order: Number(testForm.order),
      published: testForm.published,
    };

    try {
      const result = editingId
        ? await mutate(`/api/tests/${editingId}`, "PUT", payload)
        : await mutate("/api/tests", "POST", payload);

      const savedTest = result.test;
      setStatusMessage(editingId ? "Test zaktualizowany." : "Test dodany.");

      if (!editingId && savedTest) {
        setEditingId(savedTest.id);
        window.history.replaceState(null, "", `/teacher/tests/${savedTest.id}`);
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Nie udało się zapisać testu.");
    }
  }

  const selectedTopic = allTopics.find((topic) => topic.id === testForm.topicId) ?? null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
            Kreator testów
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Nowy test</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Pytania, odpowiedzi i punktacja są teraz na osobnej stronie, więc nic się nie nakłada.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/teacher" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950">
            Wróć do panelu
          </Link>
          <button type="button" onClick={resetEditor} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950">
            Nowy test
          </button>
        </div>
      </div>

      {statusMessage ? <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{statusMessage}</div> : null}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Ładowanie danych...</p>
      ) : (
        <form onSubmit={submitTest} className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] xl:items-start">
          <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
              <select value={testForm.topicId} onChange={(event) => setTestForm((current) => ({ ...current, topicId: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none">
                <option value="">Wybierz temat</option>
                {allTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.chapter.title} / {topic.title}
                  </option>
                ))}
              </select>
              <input value={testForm.title} onChange={(event) => setTestForm((current) => ({ ...current, title: event.target.value }))} placeholder="Tytuł testu" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-950">Pytania</h2>
                  <p className="text-sm text-slate-500">Dodawaj, edytuj i ustawiaj punktację bez przewijania całej strony.</p>
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">{testQuestions.length} pytań · {totalTestPoints} pkt</div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => {
                  const nextQuestion = createEmptyQuestion("text");
                  setTestQuestions((current) => [...current, nextQuestion]);
                  setActiveQuestionId(nextQuestion.id);
                  window.setTimeout(() => scrollToQuestion(nextQuestion.id), 0);
                }} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">+ Pytanie wpisywane</button>
                <button type="button" onClick={() => {
                  const nextQuestion = createEmptyQuestion("abcd");
                  setTestQuestions((current) => [...current, nextQuestion]);
                  setActiveQuestionId(nextQuestion.id);
                  window.setTimeout(() => scrollToQuestion(nextQuestion.id), 0);
                }} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">+ Pytanie ABCD</button>
              </div>

              {testQuestions.length > 1 ? (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                  {testQuestions.map((question, index) => (
                    <button key={question.id} type="button" onClick={() => scrollToQuestion(question.id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeQuestionId === question.id ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400"}`}>
                      {index + 1}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                {testQuestions.map((question, index) => (
                  <div key={question.id} ref={(element) => { questionRefs.current[question.id] = element; }} className={`rounded-2xl border p-4 transition ${activeQuestionId === question.id ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-950">Pytanie {index + 1}</p>
                      <div className="flex items-center gap-2">
                        <select value={question.type} onChange={(event) => {
                          const nextType = event.target.value as TestQuestionType;
                          setTestQuestions((current) => current.map((item) => item.id === question.id ? { ...item, type: nextType, options: nextType === "abcd" ? item.options : ["", "", "", ""] } : item));
                        }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                          <option value="text">Wpisywane</option>
                          <option value="abcd">ABCD</option>
                        </select>
                        {testQuestions.length > 1 ? <button type="button" onClick={() => setTestQuestions((current) => current.filter((item) => item.id !== question.id))} className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700">Usuń</button> : null}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3">
                      <textarea value={question.prompt} onChange={(event) => setTestQuestions((current) => current.map((item) => item.id === question.id ? { ...item, prompt: event.target.value } : item))} placeholder="Treść pytania" rows={2} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" />

                      {question.type === "abcd" ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {question.options.map((option, optionIndex) => (
                            <input key={`${question.id}-${optionIndex}`} value={option} onChange={(event) => setTestQuestions((current) => current.map((item) => {
                              if (item.id !== question.id) return item;
                              const nextOptions = [...item.options] as [string, string, string, string];
                              nextOptions[optionIndex] = event.target.value;
                              return { ...item, options: nextOptions };
                            }))} placeholder={`Opcja ${String.fromCharCode(65 + optionIndex)}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" />
                          ))}
                        </div>
                      ) : null}

                      <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
                        {question.type === "abcd" ? (
                          <select value={question.correctAnswer} onChange={(event) => setTestQuestions((current) => current.map((item) => item.id === question.id ? { ...item, correctAnswer: event.target.value } : item))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none">
                            <option value="">Poprawna odpowiedź</option>
                            {question.options.map((item, optionIndex) => {
                              const trimmed = item.trim();
                              return trimmed ? <option key={`${question.id}-${trimmed}-${optionIndex}`} value={trimmed}>{trimmed}</option> : null;
                            })}
                          </select>
                        ) : (
                          <input value={question.correctAnswer} onChange={(event) => setTestQuestions((current) => current.map((item) => item.id === question.id ? { ...item, correctAnswer: event.target.value } : item))} placeholder="Poprawna odpowiedź" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" />
                        )}

                        <input value={String(question.points)} onChange={(event) => setTestQuestions((current) => current.map((item) => item.id === question.id ? { ...item, points: Number.parseInt(event.target.value || "1", 10) || 1 } : item))} type="number" min="1" placeholder="Punkty" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => setShowAdvanced((current) => !current)} className="mt-4 w-fit rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                {showAdvanced ? "Ukryj opcje zaawansowane" : "Pokaż opcje zaawansowane"}
              </button>

              {showAdvanced ? (
                <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
                  <input value={testForm.status} onChange={(event) => setTestForm((current) => ({ ...current, status: event.target.value }))} placeholder="Status testu" className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none" />
                  <input value={testForm.order} onChange={(event) => setTestForm((current) => ({ ...current, order: event.target.value }))} type="number" min="0" placeholder="Kolejność" className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none" />
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 sm:col-span-2">
                    <input checked={testForm.published} onChange={(event) => setTestForm((current) => ({ ...current, published: event.target.checked }))} type="checkbox" />
                    Opublikowany test
                  </label>
                </div>
              ) : null}

              <button type="submit" className="mt-4 rounded-2xl bg-amber-500 px-5 py-3 font-semibold text-slate-950">
                {editingId ? "Zapisz zmiany" : "Dodaj test"}
              </button>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Podgląd testu</h3>
                <p className="text-sm text-slate-500">Widok ucznia w czasie edycji.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{testQuestions.length} pytań</span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {selectedTopic ? `${selectedTopic.chapter.title} / ${selectedTopic.title}` : "Brak tematu"}
              </p>
              <h4 className="mt-2 text-xl font-black tracking-tight text-slate-950">{testForm.title.trim() || "Tytuł testu pojawi się tutaj"}</h4>
              <p className="mt-2 text-sm text-slate-600">Status: {testForm.status.trim() || "-"} · {totalTestPoints} pkt · {testQuestions.some((question) => question.type === "abcd") ? "ABCD / wpisywane" : "wpisywane"}</p>
            </div>

            <div className="mt-4 space-y-3">
              {testQuestions.map((question, index) => (
                <button key={question.id} type="button" onClick={() => scrollToQuestion(question.id)} className={`block w-full rounded-2xl border p-4 text-left transition ${activeQuestionId === question.id ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">Pytanie {index + 1}</p>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">{question.points} pkt</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{question.prompt || "Brak treści pytania"}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-500">{question.type === "abcd" ? "ABCD" : "Wpisywane"}</p>
                </button>
              ))}
            </div>

            {activeQuestion ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Aktywne pytanie</p>
                <p className="mt-2 text-sm font-semibold">{activeQuestion.prompt || "Brak treści pytania"}</p>
                <p className="mt-2 text-xs text-white/70">Odpowiedź: {activeQuestion.correctAnswer || "-"} · Typ: {activeQuestion.type === "abcd" ? "ABCD" : "wpisywane"} · {activeQuestion.points} pkt</p>
              </div>
            ) : null}
          </aside>
        </form>
      )}
    </section>
  );
}