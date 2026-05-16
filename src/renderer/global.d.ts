import type { FilterType } from '../types';

declare global {
  interface Window {
    watcherApi: {
      startWatching: (url: string) => Promise<{ id: number; name: string; url: string }>;
      refresh: (url: string, filter: FilterType) => Promise<any[]>;
    };
  }
}

export {};
