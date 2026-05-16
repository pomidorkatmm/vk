import { getItemsByCommunity, insertOrTouchItems, touchCommunityChecked, upsertCommunity } from '../db/repository';
import { scanCommunity } from '../parser/playwrightParser';
import type { FilterType, Item } from '../types';

function startOfToday() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function startWatching(url: string) {
  const parsed = await scanCommunity(url);
  const community = upsertCommunity(url, parsed.name);
  const existing = getItemsByCommunity(community.id);
  if (existing.length === 0) {
    insertOrTouchItems(community.id, parsed.items);
  }
  touchCommunityChecked(community.id);
  return community;
}

export async function refreshCommunity(url: string, filter: FilterType): Promise<Item[]> {
  const parsed = await scanCommunity(url);
  const community = upsertCommunity(url, parsed.name);
  const before = getItemsByCommunity(community.id);
  const knownKeys = new Set(before.map((i) => i.item_key));
  const newItems = parsed.items.filter((i) => !knownKeys.has(i.itemKey));
  insertOrTouchItems(community.id, parsed.items);
  touchCommunityChecked(community.id);
  const all = getItemsByCommunity(community.id);

  const threshold = (() => {
    if (filter === 'today') return startOfToday();
    if (filter === 'week') return new Date(Date.now() - 7 * 24 * 3600 * 1000);
    if (filter === 'since_last_update') return new Date((community.last_checked_at ?? community.created_at));
    return new Date(community.created_at);
  })();

  return all.filter((i) => {
    const seen = new Date(i.first_seen_at);
    const isInWindow = seen >= threshold;
    if (filter === 'since_start') return knownKeys.has(i.item_key) ? false : true;
    return isInWindow && newItems.some((n) => n.itemKey === i.item_key);
  });
}
