export interface CardInfo {
  name: string;
  set: string;
  artist: string;
  emoji: string;
  affiliateUrl?: string;
}

export interface AffiliateProduct {
  name: string;
  url: string;
  price: string;
  tag: string;
  emoji: string;
}

export interface Episode {
  id: number;
  slug: string;
  title: string;
  cards: CardInfo[];
  products?: AffiliateProduct[];
  status: "live" | "locked";
  junior?: StoryData;
  full?: StoryData;
}

export interface Series {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  type: string;
  color: string;
  accent: string;
  bg: string;
  desc: string;
  status: "Airing" | "Coming Soon";
  epCount: number;
  episodes: Episode[];
}

export type StoryBlockType = "p" | "q" | "a" | "end";

export interface StoryBlock {
  t: StoryBlockType;
  c: string;
  speaker?: string;
}

export interface StoryData {
  scene: string;
  paragraphs: StoryBlock[];
}

export interface ShopProduct {
  id: number;
  icon: string;
  name: string;
  desc: string;
  price: string;
  cat: string;
}

export interface Submission {
  name: string;
  cardName: string;
  series: string;
  photo: File | null;
  reason: string;
}
