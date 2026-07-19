const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

const PORT = 3456;
const HOST = '127.0.0.1';
const APP_URL = `http://${HOST}:${PORT}`;

function startServer() {
  return new Promise((resolve, reject) => {
    // Path to the standalone server.js inside resources/app/
    const serverPath = path.join(process.resourcesPath, 'app', 'server.js');

    const env = {
      ...process.env,
      HOSTNAME: HOST,
      PORT: String(PORT),
      NODE_ENV: 'production'
    };

    serverProcess = spawn(process.execPath, [serverPath], {
      env,
      cwd: path.join(process.resourcesPath, 'app'),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let serverOutput = '';
    serverProcess.stdout.on('data', (data) => {
      const text = data.toString();
      serverOutput += text;
      console.log('[server stdout]', text.trim());
    });

    serverProcess.stderr.on('data', (data) => {
      const text = data.toString();
      serverOutput += text;
      console.log('[server stderr]', text.trim());
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err);
      reject(new Error('Failed to start server: ' + err.message));
    });

    serverProcess.on('exit', (code) => {
      console.log(`Server process exited with code ${code}`);
      if (code !== 0 && code !== null) {
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    // Poll until server responds
    const maxAttempts = 60; // 60 * 500ms = 30 seconds
    let attempts = 0;

    const pollInterval = setInterval(() => {
      attempts++;

      const http = require('http');
      const req = http.get(APP_URL, (res) => {
        clearInterval(pollInterval);
        console.log(`Server responded after ${attempts} attempts`);
        resolve();
      });

      req.on('error', () => {
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          const err = new Error(
            'Server did not respond\n' +
            'Vérifiez que le port ' + PORT + " n'est pas utilisé.\n" +
            'Detail: Server did not respond'
          );
          console.error(err.message);
          console.error('Server output:', serverOutput.slice(-2000));
          reject(err);
        }
      });

      req.setTimeout(1000);
    }, 500);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'GradeAssist',
    icon: path.join(process.resourcesPath, 'app', 'electron', 'icon.ico'),
    webPreferences: {
      preload: path.join(process.resourcesPath, 'app', 'electron', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function showStartupError(message) {
  const { dialog } = require('electron');
  dialog.showMessageBoxSync({
    type: 'error',
    title: 'Erreur de démarrage',
    message: "GradeAssist n'a pas pu démarrer.",
    detail: message,
    buttons: ['OK']
  });
  app.quit();
}

app.on('ready', async () => {
  try {
    await startServer();
    createWindow();
  } catch (err) {
    showStartupError(err.message);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    // Try graceful shutdown
    serverProcess.kill('SIGTERM');
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }, 3000);
  }
});