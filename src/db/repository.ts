import { getDb, nextCommunityId, nextItemId, now, saveDb } from './database';
import type { Community, Item, ParsedItemInput } from '../types';

export function getCommunities(): Community[] {
  return [...getDb().communities].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function upsertCommunity(url: string, name: string): Community {
  const db = getDb();
  let community = db.communities.find((c) => c.url === url);
  if (!community) {
    community = { id: nextCommunityId(), url, name, created_at: now(), last_checked_at: null };
    db.communities.push(community);
  } else {
    community.name = name;
  }
  saveDb();
  return community;
}

export function touchCommunityChecked(id: number) {
  const community = getDb().communities.find((c) => c.id === id);
  if (community) community.last_checked_at = now();
  saveDb();
}

export function getItemsByCommunity(communityId: number): Item[] {
  return getDb().items
    .filter((i) => i.community_id === communityId)
    .sort((a, b) => b.first_seen_at.localeCompare(a.first_seen_at));
}

export function insertOrTouchItems(communityId: number, items: ParsedItemInput[]) {
  const db = getDb();
  const ts = now();
  for (const item of items) {
    const existing = db.items.find((x) => x.item_key === item.itemKey);
    if (existing) {
      existing.last_seen_at = ts;
      existing.title = item.title ?? existing.title;
      existing.text = item.text ?? existing.text;
      existing.preview_url = item.previewUrl ?? existing.preview_url;
      continue;
    }
    db.items.push({
      id: nextItemId(),
      community_id: communityId,
      section: item.section,
      item_key: item.itemKey,
      title: item.title ?? null,
      text: item.text ?? null,
      url: item.url ?? null,
      preview_url: item.previewUrl ?? null,
      published_at: item.publishedAt ?? null,
      first_seen_at: ts,
      last_seen_at: ts
    });
  }
  saveDb();
}
