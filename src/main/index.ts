import path from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { startWatching, refreshCommunity } from '../services/watcherService';

let splash: BrowserWindow | null = null;

function createSplash() {
  splash = new BrowserWindow({
    width: 420,
    height: 260,
    frame: false,
    alwaysOnTop: true,
    transparent: false,
    backgroundColor: '#0b0b0b',
    show: true
  });
  splash.loadURL(`data:text/html,${encodeURIComponent(`
    <body style="margin:0;background:#0b0b0b;color:#ffd400;display:flex;align-items:center;justify-content:center;font-family:Segoe UI">
      <div style='text-align:center'>
        <h2>Community Watcher</h2>
        <p>Loading...</p>
      </div>
    </body>
  `)}`);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    show: false,
    icon: path.join(process.cwd(), 'build/icon.png'),
    backgroundColor: '#0b0b0b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.once('ready-to-show', () => {
    splash?.close();
    splash = null;
    win.show();
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createSplash();
  ipcMain.handle('watcher:start', async (_e, url: string) => {
    try { return await startWatching(url); }
    catch (error: any) { throw new Error(`Не удалось начать слежку: ${error?.message ?? 'unknown error'}`); }
  });
  ipcMain.handle('watcher:refresh', async (_e, url: string, filter: any) => {
    try { return await refreshCommunity(url, filter); }
    catch (error: any) { throw new Error(`Не удалось обновить данные: ${error?.message ?? 'unknown error'}`); }
  });
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
