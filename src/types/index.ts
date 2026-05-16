export type SectionType = 'posts' | 'videos' | 'clips' | 'photos' | 'other';

export type FilterType = 'since_last_update' | 'since_start' | 'today' | 'week';

export interface Community {
  id: number;
  url: string;
  name: string;
  created_at: string;
  last_checked_at: string | null;
}

export interface Item {
  id: number;
  community_id: number;
  section: SectionType;
  item_key: string;
  title: string | null;
  text: string | null;
  url: string | null;
  preview_url: string | null;
  published_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

export interface ParsedItemInput {
  section: SectionType;
  itemKey: string;
  title?: string;
  text?: string;
  url?: string;
  previewUrl?: string;
  publishedAt?: string;
}
