const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const path = require('path');

const APP_URL = process.env.SUBSERVICE_HUB_URL || 'https://subservice-hub.lovable.app';

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: '#0b1020',
    title: 'Subservice Hub',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.loadURL(APP_URL);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url, isMainFrame) => {
    if (!isMainFrame) return;
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Tidak dapat terhubung',
      message: 'Aplikasi butuh koneksi internet.',
      detail: `Gagal memuat ${url}\n(${code} ${desc})\n\nPeriksa koneksi internet Anda lalu coba lagi.`,
      buttons: ['Coba lagi', 'Tutup'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) mainWindow.loadURL(APP_URL);
    });
  });
}

function buildMenu() {
  const template = [
    {
      label: 'Aplikasi',
      submenu: [
        { label: 'Muat ulang', accelerator: 'CmdOrCtrl+R', click: () => mainWindow && mainWindow.reload() },
        { label: 'Beranda', click: () => mainWindow && mainWindow.loadURL(APP_URL) },
        { type: 'separator' },
        { label: 'Perbesar', role: 'zoomIn' },
        { label: 'Perkecil', role: 'zoomOut' },
        { label: 'Ukuran normal', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Layar penuh', role: 'togglefullscreen' },
        { label: 'Keluar', role: 'quit' },
      ],
    },
    {
      label: 'Ubah',
      submenu: [
        { role: 'undo', label: 'Batalkan' },
        { role: 'redo', label: 'Ulangi' },
        { type: 'separator' },
        { role: 'cut', label: 'Potong' },
        { role: 'copy', label: 'Salin' },
        { role: 'paste', label: 'Tempel' },
        { role: 'selectAll', label: 'Pilih semua' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
