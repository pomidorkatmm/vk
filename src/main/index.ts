import path from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { startWatching, refreshCommunity } from '../services/watcherService';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    backgroundColor: '#0b0b0b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('watcher:start', (_e, url: string) => startWatching(url));
  ipcMain.handle('watcher:refresh', (_e, url: string, filter: any) => refreshCommunity(url, filter));
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
