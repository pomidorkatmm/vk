import { useMemo, useState } from 'react';
import type { FilterType, Item } from '../types';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'since_last_update', label: 'Новое с последнего обновления' },
  { key: 'since_start', label: 'Новое с начала слежки' },
  { key: 'today', label: 'Сегодня' },
  { key: 'week', label: 'За неделю' }
];

export function App() {
  const [url, setUrl] = useState('');
  const [filter, setFilter] = useState<FilterType>('since_last_update');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Вставьте ссылку и нажмите “Начать слежку”');
  const [error, setError] = useState('');

  const grouped = useMemo(() => items.reduce((acc: Record<string, Item[]>, item) => {
    acc[item.section] = acc[item.section] ?? [];
    acc[item.section].push(item);
    return acc;
  }, {}), [items]);

  async function handleStart() {
    setLoading(true); setError('');
    try {
      await window.watcherApi.startWatching(url);
      setStatus('Слежка активирована. Базовое состояние сохранено.');
      setItems([]);
    } catch (e: any) {
      setError(e.message || 'Сообщество недоступно или заблокировано.');
    } finally { setLoading(false); }
  }

  async function handleRefresh() {
    setLoading(true); setError('');
    try {
      const next = await window.watcherApi.refresh(url, filter);
      setItems(next as Item[]);
      setStatus(`Найдено новых элементов: ${next.length}`);
    } catch (e: any) {
      setError(e.message || 'Не удалось обновить данные.');
    } finally { setLoading(false); }
  }

  return <div className="min-h-screen bg-brandBg text-white p-6">
    <div className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-4xl font-extrabold text-brandAccent">Community Watcher</h1>
      <div className="rounded-2xl bg-brandCard p-4 border border-yellow-500/20 shadow-2xl">
        <div className="flex flex-col gap-3">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://community-link"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 focus:border-brandAccent outline-none" />
          <div className="flex gap-3 flex-wrap">
            <button disabled={loading || !url} onClick={handleStart} className="rounded-xl bg-brandAccent px-4 py-2 text-black font-semibold disabled:opacity-50">Начать слежку</button>
            <button disabled={loading || !url} onClick={handleRefresh} className="rounded-xl border border-brandAccent px-4 py-2 text-brandAccent disabled:opacity-50">Обновить данные</button>
            <select value={filter} onChange={(e) => setFilter(e.target.value as FilterType)} className="rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2">
              {FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
          <p className="text-zinc-300">{status}</p>
          {error && <p className="text-red-400">{error}</p>}
        </div>
      </div>
      {Object.entries(grouped).map(([section, sectionItems]) => <section key={section} className="rounded-2xl bg-brandCard p-4 border border-zinc-800">
        <h2 className="text-xl text-brandAccent mb-2 capitalize">{section} <span className="text-zinc-400 text-sm">({sectionItems.length})</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sectionItems.map((item) => <article key={item.item_key} className="rounded-xl bg-zinc-900 p-3 border border-zinc-700">
            <p className="text-xs uppercase text-brandAccent">{item.section}</p>
            <h3 className="font-semibold">{item.title || 'Без названия'}</h3>
            <p className="text-sm text-zinc-400">{item.text}</p>
            {item.preview_url && <img src={item.preview_url} className="mt-2 h-40 w-full object-cover rounded-lg" />}
            <p className="text-xs text-zinc-500 mt-2">Обнаружено: {new Date(item.first_seen_at).toLocaleString()}</p>
            <div className="mt-2 flex gap-2">{item.url && <a href={item.url} target="_blank" className="rounded-lg bg-brandAccent text-black px-3 py-1 text-sm">Открыть</a>}
            {item.url && <button onClick={() => navigator.clipboard.writeText(item.url!)} className="rounded-lg border border-brandAccent px-3 py-1 text-brandAccent text-sm">Скопировать ссылку</button>}</div>
          </article>)}
        </div>
      </section>)}
    </div>
  </div>;
}
