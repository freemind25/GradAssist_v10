const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');

let mainWindow = null;
let splashWindow = null;

const APP_URL = 'https://grad-assist-v10.vercel.app/';
const LOAD_TIMEOUT_MS = 25000;
const MAX_ATTEMPTS = 3;

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
  #status { font-size: 13px; color: rgba(255,255,255,0.7); text-align: center; padding: 0 24px; }
</style>
</head>
<body>
  <div class="logo">Grade<span class="accent">Assist</span></div>
  <div class="subtitle">Gestion Pedagogique Universitaire</div>
  <div class="spinner"></div>
  <div id="status">Connexion a l application...</div>
  <script>
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('splash:status', (_e, message) => {
      const el = document.getElementById('status');
      if (el) el.textContent = message;
    });
  </script>
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
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(SPLASH_HTML));
  splashWindow.on('closed', () => { splashWindow = null; });
}

function setSplashStatus(message) {
  if (splashWindow && !splashWindow.isDestroyed() && splashWindow.webContents) {
    splashWindow.webContents.send('splash:status', message);
  }
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

/**
 * Charge APP_URL avec un timeout. Résout true si la page a démarré à se charger.
 */
function loadAppWithTimeout() {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      mainWindow.webContents.removeListener('did-finish-load', onSuccess);
      mainWindow.webContents.removeListener('did-fail-load', onFailure);
      resolve(ok);
    };
    const onSuccess = () => finish(true);
    const onFailure = (_event, code, desc, url, isMain) => {
      if (isMain) finish(false);
    };

    const timer = setTimeout(() => finish(false), LOAD_TIMEOUT_MS);

    mainWindow.webContents.on('did-finish-load', onSuccess);
    mainWindow.webContents.on('did-fail-load', onFailure);

    mainWindow.loadURL(APP_URL).catch(() => {
      // Erreur de navigation — onFailure/timeout s'en occupe
    });
  });
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

  // Relances : les environnements réseau lents ou Vercel cold-start peuvent
  // faire échouer le premier chargement (white screen en v2.9.4/v2.9.5).
  let loaded = false;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !loaded; attempt++) {
    setSplashStatus(
      attempt === 1
        ? 'Connexion a l application...'
        : `Nouvelle tentative (${attempt}/${MAX_ATTEMPTS})...`
    );
    loaded = await loadAppWithTimeout();
  }

  if (loaded) {
    closeSplash();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  } else {
    closeSplash();
    dialog.showErrorBox(
      'GradeAssist — connexion impossible',
      "L'application n'a pas pu se connecter a son serveur apres " +
      MAX_ATTEMPTS + ' tentatives.\n\n' +
      'Verifiez votre connexion internet puis relancez GradeAssist.\n\n' +
      "Vous pouvez aussi acceder a l'application via votre navigateur :\n" +
      'https://grad-assist-v10.vercel.app/'
    );
    app.quit();
    return;
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
