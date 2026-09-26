const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow = null;
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
 *
 * Contrairement à un simple serveur de fichiers statiques, ce serveur exécute
 * l'application complète ET les routes API (/api/mistral, /api/auth, /api/health),
 * exactement comme en production. C'est la sortie de `next build`
 * (output: 'standalone') préparée par scripts/copy-standalone.js.
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
      ELECTRON_RUN_AS_NODE: '1', // exécute Electron en mode Node pur
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
function waitForServer(url, timeoutMs = 60000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume(); // drain la réponse
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(
            new Error(`Le serveur local n'a pas répondu dans les ${timeoutMs / 1000} secondes.`)
          );
        } else {
          setTimeout(attempt, 300);
        }
      });
    };
    attempt();
  });
}

function ensureServerReady() {
  if (!serverStarting) {
    serverStarting = (async () => {
      startServer();
      await waitForServer(BASE_URL);
    })().catch((error) => {
      serverStarting = null; // permet une nouvelle tentative
      throw error;
    });
  }
  return serverStarting;
}

async function createWindow() {
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
      sandbox: true,        // [SEC-11] Sandbox activé — sécurité renforcée
      webSecurity: true,    // HTTPS + same-origin policy
      allowRunningInsecureContent: false,
    },
    autoHideMenuBar: false,
    show: false,
  });

  // Load from the local Next.js server (required for Google OAuth + API routes)
  try {
    await ensureServerReady();
    await mainWindow.loadURL(BASE_URL);
  } catch (error) {
    console.error('Failed to start local server:', error);
    dialog.showErrorBox(
      'GradeAssist — Erreur de démarrage',
      `Impossible de démarrer le serveur local de l'application.\n\n${error.message}`
    );
    app.quit();
    return;
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // [SEC-11] Restreindre la navigation à l'origine locale uniquement
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
