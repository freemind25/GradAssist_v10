const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');

let mainWindow = null;
let splashWindow = null;

const APP_URL = 'https://grad-assist-v10.vercel.app/';

// ─── Splash HTML ───
const SPLASH_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Tahoma, sans-serif;
    background: #1B2A4E;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    overflow: hidden;
  }
  .logo { font-size: 38px; font-weight: 800; margin-bottom: 6px; }
  .logo .accent { color: #D97706; }
  .subtitle { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 28px; }
  .spinner {
    width: 32px; height: 32px;
    border: 3px solid rgba(255,255,255,0.12);
    border-top-color: #D97706;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 14px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  #status { font-size: 13px; color: rgba(255,255,255,0.7); }
</style>
</head>
<body>
  <div class="logo">Grade<span class="accent">Assist</span></div>
  <div class="subtitle">Gestion Pedagogique Universitaire</div>
  <div class="spinner"></div>
  <div id="status">Connexion a l application...</div>
</body>
</html>`;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    show: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(SPLASH_HTML));
  splashWindow.on('closed', () => { splashWindow = null; });
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

async function createWindow() {
  createSplashWindow();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'GradeAssist',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
    autoHideMenuBar: false,
    show: false,
  });

  try {
    await mainWindow.loadURL(APP_URL);
    mainWindow.once('ready-to-show', () => {
      closeSplash();
      mainWindow.show();
      mainWindow.focus();
    });
    setTimeout(() => {
      if (mainWindow && !mainWindow.isVisible()) {
        closeSplash();
        mainWindow.show();
        mainWindow.focus();
      }
    }, 8000);
  } catch (error) {
    closeSplash();
    dialog.showErrorBox(
      'GradeAssist',
      'Impossible de charger l application.\nVerifiez votre connexion internet.\n\n' +
      'Vous pouvez aussi acceder a GradeAssist via:\n' +
      'https://grad-assist-v10.vercel.app/'
    );
    app.quit();
  }

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_URL) && !url.startsWith('https://accounts.google.com')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
