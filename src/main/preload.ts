import { contextBridge, ipcRenderer } from 'electron';
import type { FilterType } from '../types';

contextBridge.exposeInMainWorld('watcherApi', {
  startWatching: (url: string) => ipcRenderer.invoke('watcher:start', url),
  refresh: (url: string, filter: FilterType) => ipcRenderer.invoke('watcher:refresh', url, filter)
});
