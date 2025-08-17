export type PostCard = {
  id: string;
  slug: string;
  url: string;
  title: string;
  excerpt: string;
  cover?: string;
  tags: string[];
  date: string; // ISO
  origin?: 'site' | 'dzen';
  source?: string | null;
};

export type FrontMatter = {
  title: string;
  slug: string;
  excerpt?: string;
  cover?: string;
  tags?: string[];
  date?: string;
  updated?: string;
  origin?: 'site' | 'dzen';
  source?: string;
};
