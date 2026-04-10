"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const navigation = user
    ? [
        { href: "/", label: "Strona główna" },
        user.role === "teacher"
          ? { href: "/teacher", label: "Panel nauczyciela" }
          : { href: "/student", label: "Panel ucznia" },
      ]
    : [{ href: "/", label: "Strona główna" }];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,211,165,0.22),_transparent_42%),linear-gradient(180deg,#f6efe6_0%,#fffaf5_100%)] text-slate-950">
      <header className="border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">EduPlatforma</p>
            <p className="text-xs text-slate-500">Nauka, testy i materiały w jednym miejscu</p>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className={pathname === item.href ? "text-slate-950" : "hover:text-slate-950"}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {!loading && user ? (
              <>
                <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 sm:inline-flex">
                  {user.name} · {user.role === "teacher" ? "Nauczyciel" : "Uczeń"}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    router.push("/");
                  }}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Wyloguj
                </button>
              </>
            ) : (
              <Link href="/login" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:border-slate-400">
                Zaloguj się
              </Link>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}