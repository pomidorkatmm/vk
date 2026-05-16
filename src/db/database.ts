import { app } from 'electron';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { Community, Item } from '../types';

interface DbShape {
  communities: Community[];
  items: Item[];
  counters: { community: number; item: number };
}

let state: DbShape | null = null;
let dbPath = '';

function now() {
  return new Date().toISOString();
}

function bootstrap(): DbShape {
  return { communities: [], items: [], counters: { community: 0, item: 0 } };
}

export function getDb() {
  if (state) return state;
  const dir = app.getPath('userData');
  mkdirSync(dir, { recursive: true });
  dbPath = path.join(dir, 'community-watcher.db.json');
  if (!existsSync(dbPath)) {
    state = bootstrap();
    writeFileSync(dbPath, JSON.stringify(state, null, 2), 'utf-8');
    return state;
  }
  state = JSON.parse(readFileSync(dbPath, 'utf-8')) as DbShape;
  return state;
}

export function saveDb() {
  if (!state) return;
  writeFileSync(dbPath, JSON.stringify(state, null, 2), 'utf-8');
}

export function nextCommunityId() {
  const db = getDb();
  db.counters.community += 1;
  return db.counters.community;
}

export function nextItemId() {
  const db = getDb();
  db.counters.item += 1;
  return db.counters.item;
}

export { now };
