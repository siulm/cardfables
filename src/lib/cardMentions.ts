import type { CardInfo } from "./types";

export type Segment =
  | { kind: "text"; value: string }
  | { kind: "chip"; value: string; cardIndex: number };

interface Matcher {
  needle: string;
  cardIndex: number;
}

function isWordChar(ch: string): boolean {
  return /\w/.test(ch);
}

export function splitParagraph(text: string, cards: CardInfo[]): Segment[] {
  if (!text || cards.length === 0) {
    return [{ kind: "text", value: text }];
  }

  const matchers: Matcher[] = [];
  cards.forEach((card, idx) => {
    matchers.push({ needle: card.name, cardIndex: idx });
    const short = card.name.split(/\s+/)[0];
    if (short && short !== card.name) {
      matchers.push({ needle: short, cardIndex: idx });
    }
  });
  // Longer needles first so "Charizard V (SAR)" wins over "Charizard"
  matchers.sort((a, b) => b.needle.length - a.needle.length);

  const segments: Segment[] = [];
  let buffer = "";
  let i = 0;

  const flush = () => {
    if (buffer) {
      segments.push({ kind: "text", value: buffer });
      buffer = "";
    }
  };

  while (i < text.length) {
    let matched: Matcher | null = null;
    for (const m of matchers) {
      if (!text.startsWith(m.needle, i)) continue;
      const before = i === 0 ? "" : text[i - 1];
      const after = text[i + m.needle.length] ?? "";
      if (!isWordChar(before) && !isWordChar(after)) {
        matched = m;
        break;
      }
    }
    if (matched) {
      flush();
      segments.push({
        kind: "chip",
        value: text.slice(i, i + matched.needle.length),
        cardIndex: matched.cardIndex,
      });
      i += matched.needle.length;
    } else {
      buffer += text[i];
      i++;
    }
  }
  flush();
  if (segments.length === 0) {
    segments.push({ kind: "text", value: "" });
  }
  return segments;
}
