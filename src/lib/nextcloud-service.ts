/**
 * Nextcloud WebDAV Sync Service
 * 
 * Uses the WebDAV protocol to save/load GradeAssist data on a Nextcloud server.
 * No OAuth needed — just server URL, username, and app password.
 */

const APP_FOLDER = 'GradeAssist';
const DATA_FILE = 'gradeassist_data.json';
const NC_CONFIG_KEY = 'ga_nextcloud_config';
const NC_TOKEN_KEY = 'ga_nextcloud_token';

export interface NextcloudConfig {
  serverUrl: string;   // e.g. https://cloud.univ-constantine3.dz
  username: string;
}

export interface NextcloudStatus {
  connected: boolean;
  configured: boolean;
  serverUrl?: string;
  username?: string;
}

export interface NextcloudSyncResult {
  success: boolean;
  message: string;
  data?: any;
}

// ─── Config Management ───

function getConfig(): NextcloudConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(NC_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeConfig(config: NextcloudConfig) {
  localStorage.setItem(NC_CONFIG_KEY, JSON.stringify(config));
}

function clearConfig() {
  localStorage.removeItem(NC_CONFIG_KEY);
  localStorage.removeItem(NC_TOKEN_KEY);
}

function getStoredPassword(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(NC_TOKEN_KEY);
}

function storePassword(password: string) {
  localStorage.setItem(NC_TOKEN_KEY, password);
}

// ─── Status ───

export function getNextcloudStatus(): NextcloudStatus {
  const config = getConfig();
  const password = getStoredPassword();
  return {
    connected: !!config && !!password,
    configured: !!config,
    serverUrl: config?.serverUrl,
    username: config?.username,
  };
}

// ─── WebDAV Helpers ───

function getWebDavBase(config: NextcloudConfig): string {
  const base = config.serverUrl.replace(/\/+$/, '');
  return `${base}/remote.php/dav/files/${encodeURIComponent(config.username)}`;
}

function getAuthHeader(config: NextcloudConfig, password: string): string {
  return 'Basic ' + btoa(`${config.username}:${password}`);
}

async function webDavFetch(
  config: NextcloudConfig,
  password: string,
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = `${getWebDavBase(config)}/${path}`;
  const headers: Record<string, string> = {
    Authorization: getAuthHeader(config, password),
    ...((options?.headers as Record<string, string>) || {}),
  };
  return fetch(url, { ...options, headers });
}

async function ensureFolder(
  config: NextcloudConfig,
  password: string,
  folderPath: string
): Promise<void> {
  try {
    await webDavFetch(config, password, folderPath, { method: 'MKCOL' });
  } catch {
    // Folder may already exist — that's fine
  }
}

// ─── Connect (validate credentials) ───

export async function connectNextcloud(
  serverUrl: string,
  username: string,
  password: string
): Promise<NextcloudStatus> {
  // Clean the URL
  const cleanUrl = serverUrl.replace(/\/+$/, '').replace(/\/remote\.php\/dav.*$/, '');
  
  const config: NextcloudConfig = { serverUrl: cleanUrl, username };

  // Test connection with PROPFIND on root
  try {
    const res = await webDavFetch(config, password, '', {
      method: 'PROPFIND',
      headers: { Depth: '0' },
    });
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401) throw new Error('Identifiants incorrects. Vérifiez votre mot de passe ou votre mot de passe d\'application.');
      if (res.status === 404) throw new Error(`Serveur introuvable : ${cleanUrl}`);
      throw new Error(`Erreur ${res.status} : ${text.substring(0, 100)}`);
    }
  } catch (error: any) {
    if (error.message.includes('fetch')) {
      throw new Error('Impossible de contacter le serveur. Vérifiez l\'URL et votre connexion.');
    }
    throw error;
  }

  // Connection successful
  storeConfig(config);
  storePassword(password);

  return {
    connected: true,
    configured: true,
    serverUrl: cleanUrl,
    username,
  };
}

// ─── Disconnect ───

export function disconnectNextcloud(): void {
  clearConfig();
}

// ─── Save Data ───

export async function saveToNextcloud(data: any): Promise<NextcloudSyncResult> {
  const config = getConfig();
  const password = getStoredPassword();
  if (!config || !password) {
    return { success: false, message: 'Non connecté à Nextcloud' };
  }

  try {
    // Ensure the GradeAssist folder exists
    await ensureFolder(config, password, APP_FOLDER);

    // Upload the JSON data
    const jsonBlob = JSON.stringify(data, null, 2);
    const res = await webDavFetch(config, password, `${APP_FOLDER}/${DATA_FILE}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonBlob,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erreur lors de la sauvegarde (${res.status}): ${text.substring(0, 100)}`);
    }

    // Also save a timestamped backup
    const date = new Date();
    const ts = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
    await webDavFetch(config, password, `${APP_FOLDER}/backup_${ts}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: jsonBlob,
    }).catch(() => { /* ignore backup errors */ });

    return {
      success: true,
      message: `Données sauvegardées sur Nextcloud (${config.username}@${config.serverUrl})`,
    };
  } catch (error: any) {
    return { success: false, message: `Erreur : ${error.message}` };
  }
}

// ─── Load Data ───

export async function loadFromNextcloud(): Promise<NextcloudSyncResult> {
  const config = getConfig();
  const password = getStoredPassword();
  if (!config || !password) {
    return { success: false, message: 'Non connecté à Nextcloud' };
  }

  try {
    const res = await webDavFetch(config, password, `${APP_FOLDER}/${DATA_FILE}`, {
      method: 'GET',
    });

    if (res.status === 404) {
      return { success: false, message: 'Aucune donnée trouvée sur Nextcloud. Effectuez une sauvegarde d\'abord.' };
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erreur lors du chargement (${res.status}): ${text.substring(0, 100)}`);
    }

    const data = await res.json();
    return {
      success: true,
      message: 'Données chargées depuis Nextcloud',
      data,
    };
  } catch (error: any) {
    return { success: false, message: `Erreur : ${error.message}` };
  }
}

// ─── List Backups ───

export async function listNextcloudBackups(): Promise<{ name: string; date: string }[]> {
  const config = getConfig();
  const password = getStoredPassword();
  if (!config || !password) return [];

  try {
    const res = await webDavFetch(config, password, APP_FOLDER, {
      method: 'PROPFIND',
      headers: { Depth: '1' },
    });

    if (!res.ok) return [];

    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const responses = doc.querySelectorAll('response');
    const backups: { name: string; date: string }[] = [];

    responses.forEach((resp) => {
      const href = resp.querySelector('href')?.textContent || '';
      const name = decodeURIComponent(href.split('/').pop() || '');
      if (name.startsWith('backup_') && name.endsWith('.json')) {
        const dateStr = name.replace('backup_', '').replace('.json', '');
        backups.push({ name, date: dateStr });
      }
    });

    return backups.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

// ─── Load Specific Backup ───

export async function loadNextcloudBackup(backupName: string): Promise<NextcloudSyncResult> {
  const config = getConfig();
  const password = getStoredPassword();
  if (!config || !password) {
    return { success: false, message: 'Non connecté à Nextcloud' };
  }

  try {
    const res = await webDavFetch(config, password, `${APP_FOLDER}/${backupName}`, {
      method: 'GET',
    });

    if (!res.ok) throw new Error('Backup introuvable');

    const data = await res.json();
    return { success: true, message: `Backup ${backupName} chargé`, data };
  } catch (error: any) {
    return { success: false, message: `Erreur : ${error.message}` };
  }
}
