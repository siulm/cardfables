export interface Episode {
  id: number;
  slug: string;
  title: string;
  card: string;
  set: string;
  artist: string;
  status: "live" | "locked";
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
