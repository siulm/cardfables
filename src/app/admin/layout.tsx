"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminProvider, useAdmin } from "./context";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/generate", label: "Generate", icon: "✨" },
  { href: "/admin/episodes", label: "Episodes", icon: "🃏" },
  { href: "/admin/submissions", label: "Submissions", icon: "📬" },
  { href: "/admin/shop", label: "Shop", icon: "🛍️" },
  { href: "/admin/arc", label: "Story Arc", icon: "📖" },
  { href: "/admin/series", label: "Series", icon: "🎬" },
];

function LoginGate({ children }: { children: React.ReactNode }) {
  const { authenticated, setAuthenticated, setError, error, loadSeriesList } = useAdmin();
  const [password, setPassword] = useState("");

  async function handleLogin() {
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
      setPassword("");
      loadSeriesList();
    } else {
      setError("Invalid password");
    }
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 font-heading text-2xl font-bold text-text-primary text-center">
            CardFables Admin
          </h1>
          <p className="mb-8 text-sm text-text-secondary text-center">Enter password to continue.</p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <div className="flex flex-col gap-2">
              <input
                type="password"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-dim outline-none transition-colors duration-200 focus:border-[rgba(212,137,58,0.3)]"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl px-7 py-3 text-sm font-semibold text-[#FFFEF7] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #D4893A, #B86E28)" }}
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Sidebar() {
  const pathname = usePathname();
  const { selectedSeries, setSelectedSeries, allSeries, setAuthenticated } = useAdmin();
  const seriesOptions = allSeries.length > 0 ? allSeries : [{ id: "flames-of-our-lives", title: "Flames of Our Lives" }];

  return (
    <aside className="fixed top-0 left-0 h-screen w-56 border-r border-border bg-surface flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2 no-underline">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs"
            style={{ background: "linear-gradient(135deg, #D4893A, #B86E28)" }}
          >
            📖
          </span>
          <span className="font-heading text-sm font-bold text-gold">Admin</span>
        </Link>
      </div>

      {/* Series selector */}
      <div className="px-4 py-3 border-b border-border">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-1 block">Series</label>
        <select
          value={selectedSeries}
          onChange={(e) => setSelectedSeries(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-[rgba(212,137,58,0.3)] cursor-pointer"
        >
          {seriesOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors no-underline ${
                isActive
                  ? "bg-[rgba(212,137,58,0.12)] text-[#D4893A] font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-[rgba(74,64,53,0.06)]"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors no-underline"
        >
          <span className="text-base">🌐</span>
          View Site
        </Link>
        <button
          onClick={() => setAuthenticated(false)}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <span className="text-base">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { error, setError, success, setSuccess } = useAdmin();

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 ml-56 px-8 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
            <button onClick={() => setError("")} className="ml-2 underline cursor-pointer">dismiss</button>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {success}
            <button onClick={() => setSuccess("")} className="ml-2 underline cursor-pointer">dismiss</button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <LoginGate>
        <DashboardShell>{children}</DashboardShell>
      </LoginGate>
    </AdminProvider>
  );
}
