"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAdmin } from "../context";

interface Submission {
  name: string;
  cardName: string;
  series: string;
  reason: string;
  photo: string;
  timestamp: string;
}

export default function SubmissionsPage() {
  const { setError, setPreloadedFiles } = useAdmin();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/submissions");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load submissions");
        return;
      }
      setSubmissions(data.submissions);
    } catch {
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }

  async function dismissSubmission(submission: Submission) {
    setError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timestamp: submission.timestamp }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to remove submission");
        return;
      }
      setSubmissions(submissions.filter((s) => s.timestamp !== submission.timestamp));
    } catch {
      setError("Failed to remove submission");
    }
  }

  function useForEpisode(submission: Submission) {
    // Convert base64 data URI back to a File
    const parts = submission.photo.split(",");
    const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(parts[1]);
    const arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) arr[i] = bstr.charCodeAt(i);
    const ext = mime.split("/")[1] || "jpg";
    const file = new File([arr], `${submission.cardName}.${ext}`, { type: mime });

    setPreloadedFiles([file]);
    router.push("/admin/generate");
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-text-primary">Card Submissions</h1>
        <Button variant="ghost" onClick={loadSubmissions}>
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-dim border-t-[#D4893A]" />
          <p className="text-sm text-text-secondary">Loading submissions...</p>
        </div>
      )}

      {!loading && submissions.length === 0 && (
        <p className="py-16 text-center text-sm text-text-dim">No submissions yet.</p>
      )}

      {!loading && submissions.length > 0 && (
        <div className="space-y-4">
          {submissions.map((sub, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-xl border border-border bg-surface p-4"
            >
              {/* Photo thumbnail */}
              <div className="flex-shrink-0">
                <img
                  src={sub.photo}
                  alt={sub.cardName}
                  className="h-[150px] w-[110px] rounded-lg object-cover border border-border"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-primary">{sub.cardName}</h3>
                {sub.name && (
                  <p className="text-sm text-text-secondary">by {sub.name}</p>
                )}
                {sub.series && (
                  <p className="mt-1 text-xs text-text-dim">Series: {sub.series}</p>
                )}
                {sub.reason && (
                  <p className="mt-2 text-sm text-text-secondary italic">&ldquo;{sub.reason}&rdquo;</p>
                )}
                <p className="mt-2 text-xs text-text-dim">
                  {new Date(sub.timestamp).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => useForEpisode(sub)}
                    className="text-xs px-3 py-1.5"
                  >
                    Use for Episode →
                  </Button>
                  <button
                    onClick={() => dismissSubmission(sub)}
                    className="rounded-lg px-3 py-1.5 text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
