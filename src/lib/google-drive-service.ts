/**
 * Google Drive Sync Service — Clean Reinstall
 * 
 * Uses Google Identity Services (GIS) for OAuth2 implicit flow.
 * Client ID is built-in. Token stored in localStorage.
 * Always shows account picker on connect.
 */

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const APP_FOLDER_NAME = 'GradeAssist';
const DATA_FILE_NAME = 'gradeassist_data.json';
const TOKEN_KEY = 'ga_gdrive_token';

const CLIENT_ID = '1092387829836-ib12hdsbj33alnvkejonbh4scg33v9ui.apps.googleusercontent.com';

export interface GoogleDriveStatus {
  connected: boolean;
  token?: string;
  userEmail?: string;
  configured: boolean;
}

export interface GoogleDriveSyncResult {
  success: boolean;
  message: string;
  data?: any;
}

// ─── Token Management ───

function getStoredToken(): { token: string; expiry: number; email?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.expiry && Date.now() < data.expiry - 300000) return data;
    localStorage.removeItem(TOKEN_KEY);
    return null;
  } catch {
    return null;
  }
}

function storeToken(token: string, expiry: number, email?: string) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expiry, email }));
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getGoogleDriveStatus(): GoogleDriveStatus {
  const stored = getStoredToken();
  return {
    connected: !!stored,
    token: stored?.token,
    userEmail: stored?.email,
    configured: true,
  };
}

export function isGoogleConfigured(): boolean {
  return true; // Client ID is built-in
}

// ─── GIS Script Loading ───

let gisLoaded = false;

async function loadGIS(): Promise<void> {
  if (typeof window === 'undefined') throw new Error('Not in browser');
  if ((window as any).google?.accounts?.oauth2) { gisLoaded = true; return; }
  if (gisLoaded) return;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => setTimeout(resolve, 300);
    script.onerror = () => reject(new Error('Impossible de charger Google Identity Services'));
    document.head.appendChild(script);
  });
  gisLoaded = true;
}

// ─── Get user email from token ───

async function fetchUserEmail(token: string): Promise<string | undefined> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return (await res.json()).email;
  } catch { /* ignore */ }
  return undefined;
}

// ─── OAuth2 Connect ───

export async function connectGoogleDrive(): Promise<GoogleDriveStatus> {
  clearToken(); // Always start fresh
  await loadGIS();

  return new Promise((resolve, reject) => {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: async (response: any) => {
        if (response.error) {
          const msg = response.error === 'access_denied'
            ? 'Accès refusé. Vérifiez la configuration Google Cloud Console.'
            : `Erreur: ${response.error}`;
          reject(new Error(msg));
          return;
        }
        const expiry = Date.now() + (response.expires_in || 3600) * 1000;
        const email = await fetchUserEmail(response.access_token);
        storeToken(response.access_token, expiry, email);
        resolve({ connected: true, token: response.access_token, userEmail: email, configured: true });
      },
      error_callback: () => reject(new Error('Connexion Google annulée')),
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  });
}

export function disconnectGoogleDrive(): void {
  const stored = getStoredToken();
  if (stored?.token && (window as any).google?.accounts?.oauth2) {
    (window as any).google.accounts.oauth2.revoke(stored.token, () => {});
  }
  clearToken();
}

// ─── Drive API Helpers ───

async function driveFetch(url: string, token: string, options?: RequestInit) {
  const res = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}`, ...options?.headers } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erreur API Drive (${res.status})`);
  }
  return res;
}

async function findOrCreateFolder(token: string): Promise<string> {
  const searchUrl = `${DRIVE_API_BASE}/files?q=name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`;
  const searchData = await (await driveFetch(searchUrl, token)).json();
  if (searchData.files?.[0]?.id) return searchData.files[0].id;

  const createRes = await driveFetch(`${DRIVE_API_BASE}/files`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: APP_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  return (await createRes.json()).id;
}

async function findFileInFolder(token: string, folderId: string): Promise<string | null> {
  const url = `${DRIVE_API_BASE}/files?q=name='${DATA_FILE_NAME}' and '${folderId}' in parents and trashed=false&fields=files(id)`;
  const data = await (await driveFetch(url, token)).json();
  return data.files?.[0]?.id || null;
}

// ─── Save / Load ───

export async function saveToGoogleDrive(data: any): Promise<GoogleDriveSyncResult> {
  const status = getGoogleDriveStatus();
  if (!status.token) return { success: false, message: 'Non connecté à Google Drive' };

  try {
    const folderId = await findOrCreateFolder(status.token);
    const existingFileId = await findFileInFolder(status.token, folderId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const formData = new FormData();

    if (existingFileId) {
      formData.append('metadata', new Blob([JSON.stringify({ name: DATA_FILE_NAME })], { type: 'application/json' }));
      formData.append('file', blob);
      await driveFetch(`${DRIVE_UPLOAD_BASE}/files/${existingFileId}?uploadType=multipart`, status.token, { method: 'PATCH', body: formData });
    } else {
      formData.append('metadata', new Blob([JSON.stringify({ name: DATA_FILE_NAME, parents: [folderId] })], { type: 'application/json' }));
      formData.append('file', blob);
      await driveFetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`, status.token, { method: 'POST', body: formData });
    }

    return { success: true, message: 'Données sauvegardées sur Google Drive' };
  } catch (error: any) {
    return { success: false, message: `Erreur: ${error.message}` };
  }
}

export async function loadFromGoogleDrive(): Promise<GoogleDriveSyncResult> {
  const status = getGoogleDriveStatus();
  if (!status.token) return { success: false, message: 'Non connecté à Google Drive' };

  try {
    const folderId = await findOrCreateFolder(status.token);
    const fileId = await findFileInFolder(status.token, folderId);
    if (!fileId) return { success: false, message: 'Aucune donnée trouvée sur Google Drive' };

    const data = await (await driveFetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, status.token)).json();
    return { success: true, message: 'Données chargées depuis Google Drive', data };
  } catch (error: any) {
    return { success: false, message: `Erreur: ${error.message}` };
  }
}
