"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

type AnswerMode = "text" | "abcd";

type TestDetails = {
  id: string;
  title: string;
  content: string;
  questionCount: number;
  answerMode: AnswerMode;
  topic: {
    title: string;
    chapter: {
      title: string;
    };
  };
};

type Question = {
  id: string;
  prompt: string;
  type: AnswerMode;
  correctAnswer: string;
  options: string[];
  points: number;
};

type StructuredQuestion = {
  prompt: string;
  type: AnswerMode;
  correctAnswer: string;
  options: string[];
  points: number;
};

type StructuredTestContent = {
  version: 1;
  questions: StructuredQuestion[];
};

type RunnerProps = {
  testId: string;
  mode?: "page" | "modal";
  onClose?: () => void;
};

function wordsFromContent(content: string) {
  return content
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function shuffle<T>(items: T[]) {
  const array = [...items];

  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temp = array[index];
    array[index] = array[randomIndex];
    array[randomIndex] = temp;
  }

  return array;
}

function buildLegacyQuestions(words: string[], mode: AnswerMode): Question[] {
  const shuffledWords = shuffle(words);

  return shuffledWords.map((word, index) => {
    if (mode === "text") {
      return {
        id: `${index}-${word}`,
        prompt: `Wpisz slowo zaczynajace sie na: ${word[0]?.toUpperCase() ?? "?"}...`,
        type: "text",
        correctAnswer: word,
        options: [],
        points: 1,
      };
    }

    const distractors = shuffle(words.filter((item) => item !== word)).slice(0, 3);
    const options = shuffle([word, ...distractors]);

    return {
      id: `${index}-${word}`,
      prompt: `Wybierz poprawne slowo zaczynajace sie na: ${word[0]?.toUpperCase() ?? "?"}...`,
      type: "abcd",
      correctAnswer: word,
      options,
      points: 1,
    };
  });
}

function parseQuestionsFromContent(testData: TestDetails): Question[] {
  try {
    const parsed = JSON.parse(testData.content) as StructuredTestContent;

    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.questions) || !parsed.questions.length) {
      throw new Error("Invalid structured content");
    }

    const normalizedQuestions: Question[] = parsed.questions.map((question, index) => ({
      id: `${index}-${question.prompt}`,
      prompt: String(question.prompt ?? "").trim(),
      type: question.type === "abcd" ? "abcd" : "text",
      correctAnswer: String(question.correctAnswer ?? "").trim(),
      options: Array.isArray(question.options) ? question.options.map((item) => String(item ?? "").trim()) : [],
      points: Number.isFinite(question.points) && question.points > 0 ? Math.round(question.points) : 1,
    }));

    return shuffle(normalizedQuestions);
  } catch {
    const words = wordsFromContent(testData.content);
    return buildLegacyQuestions(words, testData.answerMode);
  }
}

export function StudentTestRunner({ testId, mode = "page", onClose }: RunnerProps) {
  const [test, setTest] = useState<TestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [readyToFinalize, setReadyToFinalize] = useState(false);
  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);
  const [finalScore, setFinalScore] = useState<{ earned: number; max: number } | null>(null);

  useEffect(() => {
    void loadTest();
  }, [testId]);

  async function loadTest() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tests/${testId}`, { credentials: "include" });

      if (!response.ok) {
        setError("Nie udalo sie otworzyc testu.");
        return;
      }

      const data = (await response.json()) as { test: TestDetails };
      setTest(data.test);
      prepareAttempt(data.test);
    } catch {
      setError("Wystapil blad podczas ladowania testu.");
    } finally {
      setLoading(false);
    }
  }

  function prepareAttempt(testData: TestDetails) {
    const builtQuestions = parseQuestionsFromContent(testData);

    setQuestions(builtQuestions);
    setAnswers(Array.from({ length: builtQuestions.length }, () => ""));
    setCurrentQuestion(0);
    setCurrentAnswer("");
    setReadyToFinalize(false);
    setConfirmFinalizeOpen(false);
    setFinalScore(null);
  }

  const isLastQuestion = currentQuestion === questions.length - 1;
  const activeQuestion = questions[currentQuestion];

  const answeredCount = useMemo(
    () => answers.filter((answer) => answer.trim().length > 0).length,
    [answers],
  );

  const unansweredCount = Math.max(0, questions.length - answeredCount);

  function persistCurrentAnswer() {
    const updated = [...answers];
    updated[currentQuestion] = currentAnswer.trim();
    setAnswers(updated);
    return updated;
  }

  function openSummary() {
    persistCurrentAnswer();
    setConfirmFinalizeOpen(false);
    setReadyToFinalize(true);
  }

  function returnToQuestion(index: number) {
    setCurrentQuestion(index);
    setCurrentAnswer(answers[index] ?? "");
    setConfirmFinalizeOpen(false);
    setReadyToFinalize(false);
  }

  function returnToTestFromSummary() {
    const targetIndex = Math.min(Math.max(currentQuestion, 0), Math.max(questions.length - 1, 0));
    returnToQuestion(targetIndex);
  }

  function openFinalizeConfirm() {
    persistCurrentAnswer();
    setConfirmFinalizeOpen(true);
  }

  function closeFinalizeConfirm() {
    setConfirmFinalizeOpen(false);
  }

  function submitCurrentAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const updatedAnswers = persistCurrentAnswer();

    if (isLastQuestion) {
      setReadyToFinalize(true);
      return;
    }

    const nextQuestion = currentQuestion + 1;
    setCurrentQuestion(nextQuestion);
    setCurrentAnswer(updatedAnswers[nextQuestion] ?? "");
  }

  function finalizeAnswers() {
    let earned = 0;
    const max = questions.reduce((sum, question) => sum + question.points, 0);

    for (let index = 0; index < questions.length; index += 1) {
      const expected = questions[index].correctAnswer.toLowerCase();
      const actual = (answers[index] ?? "").trim().toLowerCase();

      if (expected === actual) {
        earned += questions[index].points;
      }
    }

    setFinalScore({ earned, max });
  }

  function restartTest() {
    if (!test) {
      return;
    }

    prepareAttempt(test);
  }

  const progressLabel = useMemo(() => {
    if (!questions.length) {
      return "Pytanie 0 z 0";
    }

    return `Pytanie ${currentQuestion + 1} z ${questions.length}`;
  }, [currentQuestion, questions.length]);

  const wrapperClass =
    mode === "modal"
      ? "px-4 py-4 lg:px-6 lg:py-6"
      : "mx-auto max-w-4xl px-6 py-12 lg:py-16";

  return (
    <section className={wrapperClass}>
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Test slowek</h1>
          <Link href="/student" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:border-slate-400">
            Wroc do panelu
          </Link>
        </div>

        {loading ? <p className="mt-6 text-sm text-slate-500">Ladowanie testu...</p> : null}
        {error ? <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

        {test && !loading && !error ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-lg font-bold text-slate-950">{test.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{test.topic.chapter.title} / {test.topic.title}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Tryb odpowiedzi: dynamiczny (wg pytania)
              </p>
            </div>

            {finalScore === null ? (
              <>
                {!readyToFinalize ? (
                  <form onSubmit={submitCurrentAnswer} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-700">{progressLabel}</p>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Odpowiedziano: {answeredCount}/{questions.length}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      <p className="font-semibold">{activeQuestion?.prompt ?? "Brak pytania."}</p>
                      <p className="mt-1 text-xs uppercase tracking-widest">Punkty: {activeQuestion?.points ?? 1}</p>
                    </div>

                    {activeQuestion?.type === "abcd" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {activeQuestion?.options.map((option, optionIndex) => (
                          <button
                            key={`${option}-${optionIndex}`}
                            type="button"
                            onClick={() => setCurrentAnswer(option)}
                            className={`rounded-2xl border px-4 py-3 text-left font-semibold transition ${
                              currentAnswer === option
                                ? "border-slate-950 bg-slate-950 text-white"
                                : "border-slate-200 bg-slate-50 text-slate-950 hover:border-slate-300"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        value={currentAnswer}
                        onChange={(event) => setCurrentAnswer(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                        placeholder="Wpisz odpowiedz (mozesz zostawic puste i wrocic pozniej)"
                      />
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button type="submit" className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">
                        {isLastQuestion ? "Zapisz i przejdz do podsumowania" : "Zapisz i dalej"}
                      </button>
                      <button
                        type="button"
                        onClick={openSummary}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-950"
                      >
                        Podsumowanie odpowiedzi
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="font-semibold">Podsumowanie odpowiedzi przed zatwierdzeniem</p>
                      <p className="mt-1">
                        Odpowiedziane: {answeredCount}, bez odpowiedzi: {unansweredCount}. Mozesz wrocic do dowolnego pytania.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {questions.map((question, index) => {
                        const answerValue = (answers[index] ?? "").trim();
                        const isAnswered = answerValue.length > 0;

                        return (
                          <button
                            key={question.id}
                            type="button"
                            onClick={() => returnToQuestion(index)}
                            className={`block w-full rounded-2xl border p-4 text-left transition ${
                              isAnswered
                                ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300"
                                : "border-red-200 bg-red-50 hover:border-red-300"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-slate-950">Pytanie {index + 1}</p>
                              <span className={`text-xs font-semibold uppercase tracking-widest ${isAnswered ? "text-emerald-700" : "text-red-700"}`}>
                                {isAnswered ? "Odpowiedziano" : "Brak odpowiedzi"}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">{question.prompt || "Brak tresci pytania"}</p>
                            {isAnswered ? <p className="mt-2 text-xs text-slate-500">Twoja odpowiedz: {answerValue}</p> : null}
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={returnToTestFromSummary}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-950"
                      >
                        Wroc do testu
                      </button>
                      <button
                        type="button"
                        onClick={openFinalizeConfirm}
                        className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white"
                      >
                        Zatwierdz odpowiedzi
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-900">
                  Wynik koncowy: {finalScore.earned}/{finalScore.max} pkt
                </div>
                <button type="button" onClick={restartTest} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-950">
                  Rozwiaz test jeszcze raz
                </button>
              </div>
            )}
          </div>
        ) : null}

        {test && !loading && !error && readyToFinalize && finalScore === null && confirmFinalizeOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl lg:p-6">
              <h3 className="text-lg font-black tracking-tight text-slate-950">Czy na pewno wyslac odpowiedzi?</h3>
              <p className="mt-2 text-sm text-slate-600">
                Odpowiedziane: {answeredCount}, bez odpowiedzi: {unansweredCount}. Sprawdz statusy ponizej przed finalnym wyslaniem.
              </p>

              <div className="mt-4 max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                {questions.map((question, index) => {
                  const answerValue = (answers[index] ?? "").trim();
                  const isAnswered = answerValue.length > 0;

                  return (
                    <div
                      key={`confirm-${question.id}`}
                      className={`rounded-2xl border px-4 py-3 ${
                        isAnswered ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-950">Pytanie {index + 1}</p>
                        <span className={`text-xs font-semibold uppercase tracking-widest ${isAnswered ? "text-emerald-700" : "text-red-700"}`}>
                          {isAnswered ? "Odpowiedziano" : "Brak odpowiedzi"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{question.prompt || "Brak tresci pytania"}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeFinalizeConfirm}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-950"
                >
                  Wroc
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeFinalizeConfirm();
                    finalizeAnswers();
                  }}
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white"
                >
                  Tak, wyslij odpowiedzi
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
