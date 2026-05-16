import { getDb } from './database';
import type { Community, Item, ParsedItemInput } from '../types';

export function getCommunities(): Community[] {
  return getDb().prepare('SELECT * FROM communities ORDER BY created_at DESC').all() as Community[];
}

export function upsertCommunity(url: string, name: string): Community {
  const now = new Date().toISOString();
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO communities (url, name, created_at) VALUES (?, ?, ?)').run(url, name, now);
  db.prepare('UPDATE communities SET name = ? WHERE url = ?').run(name, url);
  return db.prepare('SELECT * FROM communities WHERE url = ?').get(url) as Community;
}

export function touchCommunityChecked(id: number) {
  getDb().prepare('UPDATE communities SET last_checked_at = ? WHERE id = ?').run(new Date().toISOString(), id);
}

export function getItemsByCommunity(communityId: number): Item[] {
  return getDb().prepare('SELECT * FROM items WHERE community_id = ? ORDER BY first_seen_at DESC').all(communityId) as Item[];
}

export function insertOrTouchItems(communityId: number, items: ParsedItemInput[]) {
  const db = getDb();
  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO items (community_id, section, item_key, title, text, url, preview_url, published_at, first_seen_at, last_seen_at)
    VALUES (@communityId, @section, @item_key, @title, @text, @url, @preview_url, @published_at, @first_seen_at, @last_seen_at)
    ON CONFLICT(item_key) DO UPDATE SET
      last_seen_at = excluded.last_seen_at,
      title = COALESCE(excluded.title, items.title),
      text = COALESCE(excluded.text, items.text),
      preview_url = COALESCE(excluded.preview_url, items.preview_url)
  `);
  const tx = db.transaction(() => {
    for (const item of items) {
      insert.run({
        communityId,
        section: item.section,
        item_key: item.itemKey,
        title: item.title ?? null,
        text: item.text ?? null,
        url: item.url ?? null,
        preview_url: item.previewUrl ?? null,
        published_at: item.publishedAt ?? null,
        first_seen_at: now,
        last_seen_at: now
      });
    }
  });
  tx();
}
