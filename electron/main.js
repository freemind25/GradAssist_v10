const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let server;

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function getStaticPath() {
  if (!app.isPackaged) {
    return path.join(__dirname, 'standalone');
  }
  return path.join(process.resourcesPath, 'app');
}

/**
 * Create a local HTTP server to serve static files.
 * Google OAuth requires HTTP context, not file:// protocol.
 */
function createLocalServer(staticPath, port) {
  return new Promise((resolve, reject) => {
    const httpServer = http.createServer((req, res) => {
      let url = decodeURIComponent(req.url);

      // Default to index.html
      if (url === '/' || url === '') {
        url = '/index.html';
      }

      // Remove query strings
      url = url.split('?')[0];

      const filePath = path.join(staticPath, url);

      // Security: prevent directory traversal
      if (!filePath.startsWith(staticPath)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          // SPA fallback: serve index.html for unknown routes
          const indexPath = path.join(staticPath, 'index.html');
          fs.readFile(indexPath, (err2, data) => {
            if (err2) {
              res.writeHead(404);
              res.end('Not Found');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
          });
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err3, data) => {
          if (err3) {
            res.writeHead(500);
            res.end('Internal Server Error');
            return;
          }
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        });
      });
    });

    httpServer.listen(port, '127.0.0.1', () => {
      console.log(`GradeAssist server running at http://localhost:${port}`);
      resolve(httpServer);
    });

    httpServer.on('error', (error) => {
      reject(error);
    });
  });
}

function createWindow() {
  const staticPath = getStaticPath();

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
    },
    autoHideMenuBar: false,
    show: false,
  });

  // Load from local HTTP server (required for Google OAuth)
  // Fixed port required: Google Cloud Console must have this origin authorized
  const port = 18529;
  createLocalServer(staticPath, port)
    .then((httpServer) => {
      server = httpServer;
      mainWindow.loadURL(`http://127.0.0.1:${port}`);
    })
    .catch((error) => {
      console.error('Failed to start local server:', error);
      // Fallback: try loading file directly (OAuth won't work)
      const indexPath = path.join(staticPath, 'index.html');
      mainWindow.loadFile(indexPath);
    });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
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
  // Close the local HTTP server
  if (server) {
    server.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
