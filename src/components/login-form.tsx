"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { demoCredentials, roleLabels, type Role } from "@/lib/school-data";

const demoUsers = {
  teacher: {
    email: "nauczyciel@demo.pl",
    password: "teacher123",
    name: "Pani Anna",
  },
  student: {
    email: "uczen@demo.pl",
    password: "student123",
    name: "Jan Kowalski",
  },
} as const;

export function LoginForm() {
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState<string>(demoUsers.student.email);
  const [password, setPassword] = useState<string>(demoUsers.student.password);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { refresh } = useAuth();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = (await response.json().catch(() => null)) as
        | { user?: { role: Role }; error?: string }
        | null;

      if (!response.ok) {
        setMessage(data?.error ?? "Nie udało się zalogować.");
        return;
      }

      await refresh();
      router.push(data?.user?.role === "teacher" ? "/teacher" : "/student");
    } catch {
      setMessage(
        "Nie można połączyć się z serwerem logowania. Sprawdź adres strony na tym urządzeniu (ten sam host i port), połączenie sieciowe oraz czy aplikacja działa.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
      <div className="space-y-6">
        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
          Logowanie do konta ucznia lub nauczyciela
        </span>
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Wybierz rolę i wejdź do swojego panelu.</h1>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            Logowanie działa teraz przez backend API i zapisuje sesję w HttpOnly cookie.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Dane demo</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Nauczyciel</p>
              <p className="mt-2 text-sm text-slate-600">{demoCredentials.teacher}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Uczeń</p>
              <p className="mt-2 text-sm text-slate-600">{demoCredentials.student}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.1)] backdrop-blur">
        <div className="grid gap-4 sm:grid-cols-2">
          {(["student", "teacher"] as Role[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setRole(item);
                setEmail(demoUsers[item].email);
                setPassword(demoUsers[item].password);
              }}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                role === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-950 hover:border-slate-300"
              }`}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">{roleLabels[item]}</p>
              <p className={`mt-2 text-sm ${role === item ? "text-white/70" : "text-slate-600"}`}>
                {item === "teacher" ? "Dodawanie materiałów, rozdziałów i testów" : "Nauka, materiały i rozwiązywanie testów"}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Adres e-mail</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400"
              placeholder="imie@szkola.pl"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Hasło</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400"
              placeholder="Wpisz hasło"
            />
          </label>
          <button disabled={submitting} type="submit" className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
            {submitting ? "Logowanie..." : `Wejdź jako ${roleLabels[role].toLowerCase()}`}
          </button>
          {message ? <p className="text-sm font-medium text-red-600">{message}</p> : null}
        </div>

        <p className="mt-4 text-sm text-slate-500">To jest prawdziwy login oparty na bazie danych i backendzie Next.js.</p>
      </form>
    </section>
  );
}