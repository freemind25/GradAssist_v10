const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow = null;
let splashWindow = null;
let serverProcess = null;
let serverStarting = null;

const PORT = 18529;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function getStandalonePath() {
  return path.join(__dirname, 'standalone');
}

// ─── HTML du splash (sans require, sans IPC — juste du visuel) ───
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
  .logo {
    font-size: 38px;
    font-weight: 800;
    margin-bottom: 6px;
    letter-spacing: -1px;
  }
  .logo .accent { color: #D97706; }
  .subtitle {
    font-size: 12px;
    color: rgba(255,255,255,0.5);
    margin-bottom: 28px;
  }
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255,255,255,0.12);
    border-top-color: #D97706;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 14px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  #status {
    font-size: 13px;
    color: rgba(255,255,255,0.7);
    text-align: center;
  }
  .progress-bar {
    width: 260px;
    height: 3px;
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
    margin-top: 14px;
    overflow: hidden;
  }
  #progress {
    height: 100%;
    background: #D97706;
    border-radius: 2px;
    width: 5%;
    transition: width 0.4s ease;
  }
</style>
</head>
<body>
  <div class="logo">Grade<span class="accent">Assist</span></div>
  <div class="subtitle">Gestion Pedagogique Universitaire</div>
  <div class="spinner"></div>
  <div id="status">Demarrage en cours...</div>
  <div class="progress-bar"><div id="progress"></div></div>
</body>
</html>`;

// ─── Serveur Next.js standalone ───

function startServer() {
  const standalonePath = getStandalonePath();
  const serverJs = path.join(standalonePath, 'server.js');
  if (!fs.existsSync(serverJs)) {
    throw new Error(`server.js introuvable dans ${standalonePath}`);
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
    console.log(`[next] serveur arrete (code ${code})`);
    serverProcess = null;
  });

  return serverProcess;
}

function waitForServer(url, timeoutMs, onTick) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const elapsed = Date.now() - startedAt;
      if (onTick) onTick(elapsed, timeoutMs);
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Le serveur n'a pas repondu dans les ${timeoutMs / 1000}s.`));
        } else {
          setTimeout(attempt, 500);
        }
      });
    };
    attempt();
  });
}

function ensureServerReady(onTick) {
  if (!serverStarting) {
    serverStarting = (async () => {
      startServer();
      await waitForServer(BASE_URL, 90000, onTick);
    })().catch((error) => {
      serverStarting = null;
      throw error;
    });
  }
  return serverStarting;
}

// ─── Splash window ───

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    center: true,
    show: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(SPLASH_HTML));

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function updateSplash(message, progressPct) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.executeJavaScript(
      `document.getElementById('status').textContent='${message}';` +
      `document.getElementById('progress').style.width='${progressPct}%';`
    ).catch(() => {});
  }
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

// ─── Main window ───

async function createWindow() {
  // 1. Splash immédiat
  createSplashWindow();

  // 2. Fenêtre principale (masquée)
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
      allowRunningInsecureContent: false,
    },
    autoHideMenuBar: false,
    show: false,
  });

  // 3. Démarrer le serveur avec feedback
  try {
    updateSplash('Demarrage du serveur local...', 10);

    await ensureServerReady((elapsed, timeout) => {
      const seconds = Math.floor(elapsed / 1000);
      const pct = Math.min(90, 10 + (elapsed / timeout) * 80);
      updateSplash(`Demarrage du serveur... (${seconds}s)`, Math.round(pct));
    });

    updateSplash('Chargement de l application...', 95);

    // 4. Charger l'app dans la fenêtre principale
    await mainWindow.loadURL(BASE_URL);

    // 5. Fermer le splash et afficher la fenêtre
    mainWindow.once('ready-to-show', () => {
      closeSplash();
      mainWindow.show();
      mainWindow.focus();
    });

    // Safety: forcer l'affichage après 8s même si ready-to-show ne se déclenche pas
    setTimeout(() => {
      if (mainWindow && !mainWindow.isVisible()) {
        closeSplash();
        mainWindow.show();
        mainWindow.focus();
      }
    }, 8000);

  } catch (error) {
    console.error('Erreur:', error);
    updateSplash('Erreur: ' + error.message, 0);
    setTimeout(() => {
      closeSplash();
      dialog.showErrorBox(
        'GradeAssist — Erreur de demarrage',
        `Impossible de demarrer le serveur local.\n\n${error.message}\n\n` +
        'Solutions possibles:\n' +
        '1. Verifiez que votre antivirus ne bloque pas GradeAssist.exe\n' +
        '2. Essayez de lancer GradeAssist.exe en tant qu\'administrateur\n' +
        '3. Utilisez la version web: https://grad-assist-v10.vercel.app/'
      );
      app.quit();
    }, 3000);
    return;
  }

  // Sécurité : restreindre la navigation
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

// ─── App lifecycle ───

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
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
