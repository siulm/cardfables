"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAdmin } from "./context";

interface DashboardStats {
  totalEpisodes: number;
  totalSeries: number;
  airingSeries: number;
  totalSubmissions: number;
}

export default function AdminOverview() {
  const { allSeries, selectedSeries } = useAdmin();
  const [stats, setStats] = useState<DashboardStats>({
    totalEpisodes: 0,
    totalSeries: 0,
    airingSeries: 0,
    totalSubmissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        // Load submissions count
        let submissionCount = 0;
        try {
          const subRes = await fetch("/api/submissions");
          if (subRes.ok) {
            const subData = await subRes.json();
            submissionCount = subData.submissions?.length || 0;
          }
        } catch {}

        // Load story bible for current series
        let episodeCount = 0;
        try {
          const arcRes = await fetch(`/api/story-arc?seriesId=${selectedSeries}`);
          if (arcRes.ok) {
            const arcData = await arcRes.json();
            episodeCount = arcData.last_episode || 0;
          }
        } catch {}

        setStats({
          totalEpisodes: episodeCount,
          totalSeries: allSeries.length || 6,
          airingSeries: allSeries.filter((s) => s.status === "Airing").length || 1,
          totalSubmissions: submissionCount,
        });
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [allSeries, selectedSeries]);

  const statCards = [
    { label: "Episodes", value: stats.totalEpisodes, icon: "📖", href: "/admin/generate", color: "#D4893A" },
    { label: "Series", value: stats.totalSeries, icon: "🎬", href: "/admin/series", color: "#3B82F6" },
    { label: "Airing", value: stats.airingSeries, icon: "🔴", href: "/admin/series", color: "#22C55E" },
    { label: "Submissions", value: stats.totalSubmissions, icon: "📬", href: "/admin/submissions", color: "#A855F7" },
  ];

  const quickActions = [
    { label: "Generate Episode", desc: "Upload images and create a new episode", href: "/admin/generate", icon: "✨" },
    { label: "Review Submissions", desc: "See what cards readers have submitted", href: "/admin/submissions", icon: "📬" },
    { label: "Manage Shop", desc: "Edit products and affiliate links", href: "/admin/shop", icon: "🛍️" },
    { label: "Story Arc", desc: "Plan and track your narrative", href: "/admin/arc", icon: "📖" },
    { label: "Manage Series", desc: "Create and edit series metadata", href: "/admin/series", icon: "🎬" },
  ];

  return (
    <div>
      <h1 className="mb-1 font-heading text-2xl font-bold text-text-primary">
        Dashboard
      </h1>
      <p className="mb-8 text-sm text-text-secondary">
        Welcome to CardFables Admin.
      </p>

      {/* Stats */}
      {loading ? (
        <div className="flex gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 rounded-xl border border-border bg-surface p-5 animate-pulse">
              <div className="h-8 w-16 rounded bg-surface-light mb-2" />
              <div className="h-4 w-20 rounded bg-surface-light" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
          {statCards.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-[rgba(74,64,53,0.20)] no-underline"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl font-bold text-text-primary">{stat.value}</span>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <span className="text-xs text-text-secondary">{stat.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-[rgba(212,137,58,0.2)] no-underline"
          >
            <span className="text-xl mt-0.5">{action.icon}</span>
            <div>
              <div className="text-sm font-semibold text-text-primary">{action.label}</div>
              <div className="text-xs text-text-dim mt-0.5">{action.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
