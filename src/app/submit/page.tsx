"use client";

import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SERIES } from "@/lib/data";

export default function SubmitPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [cardName, setCardName] = useState("");
  const [series, setSeries] = useState("");
  const [reason, setReason] = useState("");

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

      <div className="space-y-6">
        <Field
          label="Your Name"
          placeholder="What should we call you?"
          value={name}
          onChange={setName}
        />

        <Field
          label="Card Name & Set"
          placeholder='e.g. "Charizard V — VSTAR Universe"'
          value={cardName}
          onChange={setCardName}
        />

        {/* Series radio */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">
            Which series?
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[...SERIES.map((s) => s.title), "New Series"].map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors duration-200"
                style={{
                  borderColor:
                    series === option
                      ? "rgba(212,168,70,0.3)"
                      : "rgba(255,255,255,0.10)",
                  background:
                    series === option
                      ? "rgba(212,168,70,0.05)"
                      : "var(--color-surface)",
                  color:
                    series === option ? "#D4A846" : "var(--color-text-secondary)",
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
                        ? "#D4A846"
                        : "rgba(255,255,255,0.12)",
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
        </div>

        {/* Photo upload placeholder */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">
            Card Photo
          </label>
          <div
            className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed text-sm text-text-dim"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            Drag & drop JPG or PNG (up to 10MB)
          </div>
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
          onClick={() => setSubmitted(true)}
          className="w-full"
        >
          {"\u{1F3B4}"} Submit My Card
        </Button>
      </div>
    </div>
  );
}
