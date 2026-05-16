import crypto from 'node:crypto';
import { chromium } from 'playwright';
import type { ParsedItemInput, SectionType } from '../types';

const SECTION_MAP: Record<SectionType, string[]> = {
  posts: ['post', 'news', 'feed'],
  videos: ['video'],
  clips: ['clip', 'short'],
  photos: ['photo', 'image', 'album'],
  other: []
};

function detectSection(url: string, text: string): SectionType {
  const value = `${url} ${text}`.toLowerCase();
  for (const [section, tokens] of Object.entries(SECTION_MAP) as [SectionType, string[]][]) {
    if (tokens.some((t) => value.includes(t))) return section;
  }
  return 'other';
}

function makeKey(section: string, url?: string, title?: string, text?: string) {
  if (url) return `${section}:${url}`;
  return crypto.createHash('sha256').update(`${section}|${url ?? ''}|${title ?? ''}|${text ?? ''}`).digest('hex');
}

export async function scanCommunity(url: string): Promise<{ name: string; items: ParsedItemInput[] }> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(2500);

  const title = (await page.title()) || 'Unknown community';
  const raw = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('a, article, [data-id], li')).slice(0, 250);
    return candidates.map((node) => {
      const el = node as HTMLElement;
      const anchor = node.tagName.toLowerCase() === 'a' ? (node as HTMLAnchorElement) : (node.querySelector('a') as HTMLAnchorElement | null);
      const href = anchor?.href;
      const text = el.innerText?.trim().slice(0, 500) ?? '';
      const img = (node.querySelector('img') as HTMLImageElement | null)?.src;
      return { href, text, img };
    }).filter((x) => x.href || x.text);
  });

  await browser.close();

  const unique = new Map<string, ParsedItemInput>();
  for (const entry of raw) {
    const section = detectSection(entry.href ?? '', entry.text);
    const itemKey = makeKey(section, entry.href, entry.text.slice(0, 80), entry.text);
    if (unique.has(itemKey)) continue;
    unique.set(itemKey, {
      section,
      itemKey,
      title: entry.text.slice(0, 120),
      text: entry.text,
      url: entry.href,
      previewUrl: entry.img
    });
  }

  return { name: title, items: Array.from(unique.values()) };
}
