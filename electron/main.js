const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// ─── Journalisation fichier (diagnostic des démarrages ratés) ───
let LOG_FILE = 'gradeassist-launch.log';
try {
  LOG_FILE = path.join(app.getPath('userData'), 'gradeassist-launch.log');
} catch {
  // app.getPath indisponible très tôt — garde le nom relatif
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch {}
  try { console.error(line); } catch {}
}

// Évite les écrans vides liés à d'anciens pilotes GPU
app.disableHardwareAcceleration();
app.setAppUserModelId('com.gradeassist.app');

// Toute erreur non interceptée doit être visible et tracée
process.on('uncaughtException', (err) => {
  log('ERREUR FATALE: ' + (err && err.stack ? err.stack : String(err)));
  try {
    dialog.showErrorBox(
      'GradeAssist — erreur inattendue',
      "Une erreur a empêché le démarrage de l'application.\n\n" +
        (err && err.message ? String(err.message) : String(err)) +
        '\n\nJournal complet :\n' + LOG_FILE
    );
  } catch {}
});

let mainWindow = null;
let splashWindow = null;

const APP_ORIGIN = 'https://grad-assist-v10.vercel.app';
const APP_URL = APP_ORIGIN + '/';
const LOAD_TIMEOUT_MS = 25000;
const MAX_ATTEMPTS = 3;

function isAllowedUrl(url) {
  try {
    const u = new URL(url);
    return u.origin === APP_ORIGIN || u.origin === 'https://accounts.google.com';
  } catch {
    return false;
  }
}

// ─── Splash HTML (statique — statut mis à jour via executeJavaScript, sans IPC) ───
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

function setSplashStatus(message) {
  if (splashWindow && !splashWindow.isDestroyed() && splashWindow.webContents) {
    const safe = String(message).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    splashWindow.webContents
      .executeJavaScript(`var el=document.getElementById('status'); if(el) el.textContent='${safe}';`)
      .catch(() => {});
  }
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

/**
 * Charge APP_URL avec timeout. Les codes -3 (navigation interrompue par une
 * redirection) sont ignorés : ce n'est pas un échec réseau.
 */
function loadAppWithTimeout() {
  return new Promise((resolve) => {
    const wc = mainWindow.webContents;
    let settled = false;
    let navAborted = false;

    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      wc.removeListener('did-finish-load', onSuccess);
      wc.removeListener('did-fail-load', onFailure);
      resolve(ok);
    };

    const onSuccess = () => {
      log('Chargement terminé (did-finish-load)');
      finish(true);
    };

    const onFailure = (_event, code, desc, url, isMain) => {
      if (!isMain) return;
      if (code === -3) {
        log('Navigation interrompue (-3) — redirection en cours, on ignore');
        navAborted = true;
        return;
      }
      log(`did-fail-load code=${code} desc=${desc} url=${url}`);
      finish(false);
    };

    const timer = setTimeout(() => {
      if (navAborted) return; // une redirection a pris le relais
      log(`Timeout ${LOAD_TIMEOUT_MS} ms atteint`);
      finish(false);
    }, LOAD_TIMEOUT_MS);

    wc.on('did-finish-load', onSuccess);
    wc.on('did-fail-load', onFailure);

    log('Chargement de ' + APP_URL);
    mainWindow.loadURL(APP_URL).catch((err) => log('loadURL rejeté: ' + err));
  });
}

function askRetry() {
  return dialog
    .showMessageBox({
      type: 'error',
      title: 'GradeAssist',
      message: 'Impossible de se connecter au serveur',
      detail:
        'Vérifiez votre connexion internet — le serveur ' +
        APP_ORIGIN +
        ' doit être joignable.\n\n' +
        'Journal technique :\n' +
        LOG_FILE,
      buttons: ['Réessayer', 'Quitter'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    })
    .then((r) => r.response);
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

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    log('render-process-gone: ' + JSON.stringify(details));
  });
  mainWindow.webContents.on('did-fail-load', (_event, code, desc, url, isMain) => {
    if (isMain && code !== -3) log('chargement page: code=' + code + ' ' + desc + ' ' + url);
  });

  let ok = false;
  while (!ok) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !ok; attempt++) {
      setSplashStatus(
        attempt === 1
          ? 'Connexion a l application...'
          : 'Nouvelle tentative (' + attempt + '/' + MAX_ATTEMPTS + ')...'
      );
      if (attempt > 1) {
        try { mainWindow.webContents.stop(); } catch {}
      }
      ok = await loadAppWithTimeout();
    }
    if (!ok) {
      log('Échec après ' + MAX_ATTEMPTS + ' tentatives');
      closeSplash();
      const choice = await askRetry();
      if (choice !== 0) {
        log("Utilisateur a choisi Quitter");
        app.quit();
        return;
      }
      log('Nouvel essai demandé par l utilisateur');
      createSplashWindow();
    }
    if (mainWindow && mainWindow.isDestroyed()) {
      log('Fenêtre principale détruite pendant le chargement');
      return;
    }
  }

  closeSplash();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    log('Fenêtre principale affichée — démarrage OK');
  }

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedUrl(url)) {
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
  dialog.showErrorBox(
    'GradeAssist',
    "GradeAssist est déjà en cours d'exécution.\n\n" +
      "Si aucune fenêtre n'est visible, fermez GradeAssist via le Gestionnaire " +
      'des tâches (Ctrl+Maj+Échap) puis relancez l\'application.'
  );
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.whenReady().then(() => {
    log(
      'Démarrage v' + app.getVersion() +
      ' — electron=' + process.versions.electron +
      ' chrome=' + process.versions.chrome +
      ' platform=' + process.platform
    );
    app.on('child-process-gone', (_event, details) => {
      log('child-process-gone: ' + JSON.stringify(details));
    });
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  log('window-all-closed');
  if (process.platform !== 'darwin') app.quit();
});
