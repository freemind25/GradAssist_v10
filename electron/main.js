const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow = null;
let splashWindow = null;
let serverProcess = null;
let serverStarting = null;

// Fixed port required: Google Cloud Console must have this origin authorized
const PORT = 18529;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function getStandalonePath() {
  // In packaged app: __dirname = resources/app/electron
  // standalone is at resources/app/electron/standalone
  return path.join(__dirname, 'standalone');
}

/**
 * Démarre le serveur Next.js "standalone" (server.js).
 */
function startServer() {
  const standalonePath = getStandalonePath();
  const serverJs = path.join(standalonePath, 'server.js');
  if (!fs.existsSync(serverJs)) {
    throw new Error(
      `server.js introuvable dans ${standalonePath}. ` +
        "Recréez le paquet avec `next build` puis `node scripts/copy-standalone.js`."
    );
  }

  serverProcess = spawn(process.execPath, [serverJs], {
    cwd: standalonePath,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[next] ${String(data).trim()}`);
  });
  serverProcess.stderr.on('data', (data) => {
    console.error(`[next] ${String(data).trim()}`);
  });
  serverProcess.on('exit', (code) => {
    console.log(`[next] serveur arrêté (code ${code})`);
    serverProcess = null;
  });

  return serverProcess;
}

/** Attend que le serveur réponde (prêt à servir l'application). */
function waitForServer(url, timeoutMs = 60000, onProgress) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const elapsed = Date.now() - startedAt;
      if (onProgress) {
        onProgress(elapsed, timeoutMs);
      }
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(
            new Error(`Le serveur local n'a pas répondu dans les ${timeoutMs / 1000} secondes.`)
          );
        } else {
          setTimeout(attempt, 500);
        }
      });
    };
    attempt();
  });
}

function ensureServerReady(onProgress) {
  if (!serverStarting) {
    serverStarting = (async () => {
      startServer();
      await waitForServer(BASE_URL, 60000, onProgress);
    })().catch((error) => {
      serverStarting = null;
      throw error;
    });
  }
  return serverStarting;
}

/**
 * Crée la fenêtre splash de chargement (affichée immédiatement pendant le démarrage).
 */
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 350,
    frame: false,
    transparent: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    show: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #1B2A4E;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    user-select: none;
    -webkit-app-region: drag;
  }
  .logo {
    font-size: 36px;
    font-weight: 800;
    margin-bottom: 8px;
  }
  .logo .accent { color: #D97706; }
  .subtitle {
    font-size: 13px;
    color: rgba(255,255,255,0.6);
    margin-bottom: 30px;
  }
  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(255,255,255,0.15);
    border-top-color: #D97706;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .status {
    font-size: 12px;
    color: rgba(255,255,255,0.5);
    text-align: center;
  }
  .progress-bar {
    width: 280px;
    height: 4px;
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
    margin-top: 16px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: #D97706;
    border-radius: 2px;
    transition: width 0.5s ease;
    width: 0%;
  }
</style>
</head>
<body>
  <div class="logo">Grade<span class="accent">Assist</span></div>
  <div class="subtitle">Application de Gestion Pedagogique Universitaire</div>
  <div class="spinner"></div>
  <div class="status" id="status">Demarrage du serveur local...</div>
  <div class="progress-bar"><div class="progress-fill" id="progress"></div></div>
  <script>
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('loading-progress', (event, data) => {
      document.getElementById('status').textContent = data.message;
      const pct = Math.min(95, (data.elapsed / data.timeout) * 100);
      document.getElementById('progress').style.width = pct + '%';
    });
    ipcRenderer.on('loading-done', () => {
      document.getElementById('status').textContent = 'Presque pret...';
      document.getElementById('progress').style.width = '100%';
    });
    ipcRenderer.on('loading-error', (event, data) => {
      document.getElementById('status').textContent = 'Erreur: ' + data.message;
      document.querySelector('.spinner').style.display = 'none';
      document.getElementById('progress').style.width = '0%';
    });
  </script>
</body>
</html>
  `));

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

async function createWindow() {
  // Afficher la fenêtre splash immédiatement
  createSplashWindow();

  // Créer la fenêtre principale (masquée)
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
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    autoHideMenuBar: false,
    show: false,  // Masquée jusqu'au chargement complet
  });

  // Démarrer le serveur avec feedback de progression
  try {
    await ensureServerReady((elapsed, timeout) => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        const seconds = Math.floor(elapsed / 1000);
        splashWindow.webContents.send('loading-progress', {
          message: `Demarrage du serveur... (${seconds}s)`,
          elapsed: elapsed,
          timeout: timeout,
        });
      }
    });

    // Serveur pret — charger l'application
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.send('loading-done');
    }

    await mainWindow.loadURL(BASE_URL);

    // Fermer le splash et afficher la fenêtre principale
    mainWindow.once('ready-to-show', () => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();
      mainWindow.focus();
    });

    // Si ready-to-show ne se déclenche pas dans les 10s, forcer l'affichage
    setTimeout(() => {
      if (mainWindow && !mainWindow.isVisible()) {
        if (splashWindow && !splashWindow.isDestroyed()) {
          splashWindow.close();
          splashWindow = null;
        }
        mainWindow.show();
        mainWindow.focus();
      }
    }, 10000);

  } catch (error) {
    console.error('Failed to start local server:', error);
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.send('loading-error', { message: error.message });
    }
    setTimeout(() => {
      dialog.showErrorBox(
        'GradeAssist — Erreur de demarrage',
        `Impossible de demarrer le serveur local de l'application.\n\n${error.message}\n\nVerifiez que l'antivirus ne bloque pas l'application.`
      );
      app.quit();
    }, 2000);
    return;
  }

  // [SEC-11] Restreindre la navigation a l'origine locale uniquement
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(BASE_URL)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock
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
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  // Arrêter le serveur Next.js local
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
