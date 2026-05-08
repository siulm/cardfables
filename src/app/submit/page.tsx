"use client";

import { useState, useRef } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SERIES } from "@/lib/data";

export default function SubmitPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [cardName, setCardName] = useState("");
  const [series, setSeries] = useState("");
  const [reason, setReason] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setPhoto(file);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handlePhotoFiles(e.dataTransfer.files);
  }

  async function handleSubmit() {
    setError("");

    if (!cardName.trim()) {
      setError("Card name is required.");
      return;
    }
    if (!photo) {
      setError("Card photo is required.");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("cardName", cardName);
    formData.append("series", series);
    formData.append("reason", reason);
    formData.append("photo", photo);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Submission could not be processed.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Submission could not be processed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-6 pt-28 pb-16 text-center">
        <div className="text-6xl mb-6">{"\u{1F389}"}</div>
        <h1 className="mb-3 font-heading text-3xl font-bold text-text-primary">
          Card Submitted!
        </h1>
        <p className="mb-8 text-sm text-text-secondary">
          We&apos;ll review it and let you know if it becomes the next episode.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button href="/" variant="ghost">
            Back Home
          </Button>
          <Button onClick={() => {
            setSubmitted(false);
            setName("");
            setCardName("");
            setSeries("");
            setReason("");
            setPhoto(null);
            setError("");
          }}>
            Submit Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 pt-28 pb-16">
      <h1 className="mb-2 font-heading text-3xl font-bold text-text-primary">
        {"\u{1F3B4}"} Submit a Card
      </h1>
      <p className="mb-10 text-sm text-text-secondary">
        Got a card with a scene that deserves a fable? Submit it and your card
        might become the next episode.
      </p>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <Field
          label="Your Name (optional)"
          placeholder="What should we call you?"
          value={name}
          onChange={setName}
        />

        <Field
          label="Card Name & Set *"
          placeholder='e.g. "Charizard V — VSTAR Universe"'
          value={cardName}
          onChange={setCardName}
        />

        {/* Series radio */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-text-secondary">
            Which series? (optional)
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[...SERIES.map((s) => s.title), "New Series"].map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors duration-200"
                style={{
                  borderColor:
                    series === option
                      ? "rgba(212,137,58,0.3)"
                      : "rgba(74,64,53,0.10)",
                  background:
                    series === option
                      ? "rgba(212,137,58,0.05)"
                      : "var(--color-surface)",
                  color:
                    series === option ? "#D4893A" : "var(--color-text-secondary)",
                }}
              >
                <input
                  type="radio"
                  name="series"
                  value={option}
                  checked={series === option}
                  onChange={(e) => setSeries(e.target.value)}
                  className="sr-only"
                />
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full border"
                  style={{
                    borderColor:
                      series === option
                        ? "#D4893A"
                        : "rgba(74,64,53,0.15)",
                  }}
                >
                  {series === option && (
                    <span className="h-2 w-2 rounded-full bg-gold" />
                  )}
                </span>
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Photo upload */}
        <div className="flex flex-col gap-2">
          <label htmlFor="field-card-photo" className="text-sm font-medium text-text-secondary">
            Card Photo *
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[128px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed text-sm text-text-dim transition-colors hover:border-[rgba(212,137,58,0.3)] hover:text-text-secondary"
            style={{ borderColor: photo ? "rgba(212,137,58,0.3)" : "rgba(74,64,53,0.10)" }}
          >
            {photo ? (
              <div className="flex items-center gap-2 px-4 py-3">
                <span>📎</span>
                <span className="text-text-primary">{photo.name}</span>
                <span className="text-text-dim">({(photo.size / 1024).toFixed(0)} KB)</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 py-4">
                <span>Drag & drop JPG, PNG, or WebP (up to 10MB)</span>
              </div>
            )}
          </div>
          <input
            id="field-card-photo"
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => handlePhotoFiles(e.target.files)}
          />
        </div>

        <Field
          label="Why this card? (optional)"
          placeholder="What story do you see in the artwork?"
          value={reason}
          onChange={setReason}
          multiline
        />

        <Button
          type="submit"
          onClick={handleSubmit}
          className={`w-full ${submitting ? "opacity-50 pointer-events-none" : ""}`}
        >
          {submitting ? "Submitting..." : "\u{1F3B4} Submit My Card"}
        </Button>
      </div>
    </div>
  );
}
