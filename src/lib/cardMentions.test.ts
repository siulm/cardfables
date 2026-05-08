import { describe, it, expect } from "vitest";
import { splitParagraph } from "./cardMentions";
import type { CardInfo } from "./types";

const charizard: CardInfo = {
  name: "Charizard V (SAR)",
  set: "VSTAR Universe",
  artist: "Oswaldo KATO",
  emoji: "🔥",
};
const venusaur: CardInfo = {
  name: "Venusaur",
  set: "Base Set",
  artist: "Mitsuhiro Arita",
  emoji: "🌿",
};

describe("splitParagraph", () => {
  it("returns single text segment when no cards", () => {
    expect(splitParagraph("hello world", [])).toEqual([
      { kind: "text", value: "hello world" },
    ]);
  });

  it("returns single text segment when no card names appear", () => {
    expect(splitParagraph("a quiet day", [charizard])).toEqual([
      { kind: "text", value: "a quiet day" },
    ]);
  });

  it("wraps short-name match (first word of card name)", () => {
    const result = splitParagraph("Charizard was napping.", [charizard]);
    expect(result).toEqual([
      { kind: "chip", value: "Charizard", cardIndex: 0 },
      { kind: "text", value: " was napping." },
    ]);
  });

  it("wraps multiple occurrences of same card", () => {
    const result = splitParagraph("Charizard saw Charizard.", [charizard]);
    expect(result).toEqual([
      { kind: "chip", value: "Charizard", cardIndex: 0 },
      { kind: "text", value: " saw " },
      { kind: "chip", value: "Charizard", cardIndex: 0 },
      { kind: "text", value: "." },
    ]);
  });

  it("wraps mentions across multiple cards", () => {
    const result = splitParagraph(
      "Charizard met Venusaur today.",
      [charizard, venusaur]
    );
    expect(result).toEqual([
      { kind: "chip", value: "Charizard", cardIndex: 0 },
      { kind: "text", value: " met " },
      { kind: "chip", value: "Venusaur", cardIndex: 1 },
      { kind: "text", value: " today." },
    ]);
  });

  it("prefers full name over short name when both match", () => {
    const result = splitParagraph(
      "Charizard V (SAR) is rare.",
      [charizard]
    );
    expect(result[0]).toEqual({
      kind: "chip",
      value: "Charizard V (SAR)",
      cardIndex: 0,
    });
  });

  it("respects word boundaries — does not match within larger word", () => {
    const result = splitParagraph("Charizardian dialect", [charizard]);
    expect(result).toEqual([
      { kind: "text", value: "Charizardian dialect" },
    ]);
  });

  it("matches at end of string (no trailing char)", () => {
    const result = splitParagraph("look — Charizard", [charizard]);
    expect(result).toEqual([
      { kind: "text", value: "look — " },
      { kind: "chip", value: "Charizard", cardIndex: 0 },
    ]);
  });

  it("matches at start of string", () => {
    const result = splitParagraph("Charizard yawned.", [charizard]);
    expect(result[0]).toEqual({
      kind: "chip",
      value: "Charizard",
      cardIndex: 0,
    });
  });

  it("handles empty text", () => {
    expect(splitParagraph("", [charizard])).toEqual([
      { kind: "text", value: "" },
    ]);
  });
});
