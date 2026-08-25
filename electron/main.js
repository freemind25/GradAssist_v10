const { app, BrowserWindow } = require("electron");
const http = require("http");
const path = require("path");
const fs = require("fs");

const isDev = !app.isPackaged;

let mainWindow = null;
let server = null;

const PORT = 8347;

// ── MIME types for static assets ──────────────────────────────────────────────
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] || "application/octet-stream";
}

// ── Resolve the standalone app root ───────────────────────────────────────────
function getStandaloneRoot() {
  if (isDev) {
    // In dev mode, the standalone output is at .next/standalone/
    return path.join(__dirname, "..", ".next", "standalone");
  }
  // In production (packaged), the standalone files are in extraResources → app/
  return path.join(process.resourcesPath, "app");
}

// ── Serve a static file ───────────────────────────────────────────────────────
function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    res.writeHead(200, { "Content-Type": mimeFor(filePath) });
    res.end(data);
  });
}

// ── Local HTTP server that mimics Next.js file-serving ────────────────────────
function startServer() {
  const root = getStandaloneRoot();

  server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let pathname = decodeURIComponent(url.pathname);

    // 1. Try exact file match (static assets, _next/static, public/)
    let candidate = path.join(root, pathname);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return serveFile(res, candidate);
    }

    // 2. Try pathname.html
    candidate = path.join(root, pathname + ".html");
    if (fs.existsSync(candidate)) {
      return serveFile(res, candidate);
    }

    // 3. Try pathname/index.html (for directory index)
    candidate = path.join(root, pathname, "index.html");
    if (fs.existsSync(candidate)) {
      return serveFile(res, candidate);
    }

    // 4. Try Next.js pages-manifest lookup for SSR routes
    try {
      const manifestPath = path.join(root, ".next", "server", "pages-manifest.json");
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        const pageKey = pathname === "/" ? "/index.html" : pathname + ".html";
        if (manifest[pageKey] || manifest[pathname]) {
          const htmlFile = path.join(root, manifest[pageKey] || manifest[pathname]);
          if (fs.existsSync(htmlFile)) {
            return serveFile(res, htmlFile);
          }
        }
      }
    } catch {
      // Ignore manifest errors
    }

    // 5. Fallback → serve index.html (SPA fallback)
    const indexFile = path.join(root, "index.html");
    if (fs.existsSync(indexFile)) {
      return serveFile(res, indexFile);
    }

    res.writeHead(404);
    res.end("Not Found");
  });

  return new Promise((resolve, reject) => {
    server.listen(PORT, "127.0.0.1", () => {
      console.log(`[GradeAssist] Local server running at http://127.0.0.1:${PORT}`);
      resolve();
    });
    server.on("error", reject);
  });
}

// ── Create the Electron window ────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "GradeAssist",
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    autoHideMenuBar: true,
    show: false, // Show after ready-to-show for a polished launch
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
  } catch (err) {
    console.error("[GradeAssist] Failed to start server:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (server) {
    server.close();
  }
  app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
