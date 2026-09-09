/**
 * Google Drive Service — OAuth 2.0 per-teacher integration.
 *
 * Scope: drive.file (only files created by this app)
 * Flow: Google Identity Services (GIS) popup → access_token stored in localStorage
 * Storage: Per-teacher (keyed by teacher email)
 */

const DRIVE_TOKEN_KEY_PREFIX = 'gradeAssist_gdrive_';
const DRIVE_EMAIL_KEY = 'gradeAssist_gdrive_email';
const DRIVE_FOLDER_KEY = 'gradeAssist_gdrive_folder_id';
// drive.file: the app can only see files IT created — never the whole Drive.
// userinfo.email: lets the app identify which teacher is connected.
const DRIVE_SCOPE =
  'https://www.googleapis.com/auth/drive.file ' +
  'https://www.googleapis.com/auth/userinfo.email';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';

// The client ID is a public identifier (safe to embed in the browser bundle).
// Default = the OAuth Web Client registered in Google Cloud Console.
// Override with NEXT_PUBLIC_GOOGLE_CLIENT_ID if you create a new client.
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '1088043365323-6n4ke2fp5fofed19vjje7gm097lsvbj7.apps.googleusercontent.com';

export interface DriveTokenData {
  accessToken: string;
  expiresAt: number; // timestamp ms
  email: string;
}

// ─── Token Management ───

function getStorageKey(teacherEmail: string): string {
  return `${DRIVE_TOKEN_KEY_PREFIX}${teacherEmail}`;
}

export function getStoredToken(): DriveTokenData | null {
  if (typeof window === 'undefined') return null;
  try {
    const email = localStorage.getItem(DRIVE_EMAIL_KEY);
    if (!email) return null;
    const raw = localStorage.getItem(getStorageKey(email));
    if (!raw) return null;
    const data: DriveTokenData = JSON.parse(raw);
    // Check expiry (with 5 min buffer)
    if (data.expiresAt && Date.now() > data.expiresAt - 5 * 60 * 1000) {
      return null; // Token expired
    }
    return data;
  } catch {
    return null;
  }
}

export function getStoredEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DRIVE_EMAIL_KEY);
}

function storeToken(data: DriveTokenData): void {
  localStorage.setItem(DRIVE_EMAIL_KEY, data.email);
  localStorage.setItem(getStorageKey(data.email), JSON.stringify(data));
}

export function clearStoredToken(): void {
  const email = localStorage.getItem(DRIVE_EMAIL_KEY);
  if (email) {
    localStorage.removeItem(getStorageKey(email));
  }
  localStorage.removeItem(DRIVE_EMAIL_KEY);
  localStorage.removeItem(DRIVE_FOLDER_KEY);
}

export function isDriveConnected(): boolean {
  return getStoredToken() !== null;
}

// ─── Google Identity Services (GIS) Integration ───

/**
 * Load the Google Identity Services script dynamically.
 */
function loadGIS(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Not in browser'));
      return;
    }
    // Already loaded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).google?.accounts) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

/**
 * Initiate Google OAuth popup flow.
 * Returns { accessToken, email } on success.
 */
export async function signInWithGoogle(): Promise<DriveTokenData> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      'Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.'
    );
  }

  await loadGIS();

  return new Promise((resolve, reject) => {
    const google = (window as unknown as Record<string, unknown>).google as {
      accounts: {
        oauth2: {
          initTokenClient: (config: Record<string, unknown>) => {
            requestAccessToken: (opts: { prompt: string }) => void;
          };
        };
      };
    };

    if (!google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not loaded'));
      return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (tokenResponse: { access_token?: string; error?: string; expires_in?: number }) => {
        if (tokenResponse.error) {
          reject(new Error(`Google OAuth error: ${tokenResponse.error}`));
          return;
        }
        const accessToken = tokenResponse.access_token;
        if (!accessToken) {
          reject(new Error('No access token received'));
          return;
        }

        // Get user email from the token
        fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((res) => res.json())
          .then((userinfo: { email?: string }) => {
            const email = userinfo.email || 'unknown';
            const expiresAt = Date.now() + (tokenResponse.expires_in || 3600) * 1000;
            const tokenData: DriveTokenData = {
              accessToken,
              expiresAt,
              email,
            };
            storeToken(tokenData);
            resolve(tokenData);
          })
          .catch(() => {
            // If we can't get email, use a fallback
            const expiresAt = Date.now() + (tokenResponse.expires_in || 3600) * 1000;
            const tokenData: DriveTokenData = {
              accessToken,
              expiresAt,
              email: 'enseignant',
            };
            storeToken(tokenData);
            resolve(tokenData);
          });
      },
    });

    // 'select_account' forces Google to show the account chooser popup,
    // so each teacher picks THEIR OWN account (never the browser's default).
    client.requestAccessToken({ prompt: 'consent select_account' });
  });
}

/**
 * Disconnect from Google Drive.
 */
export function disconnectDrive(): void {
  const token = getStoredToken();
  if (token?.accessToken) {
    // Revoke the token on Google's side
    try {
      fetch(`https://oauth2.googleapis.com/revoke?token=${token.accessToken}`, {
        method: 'POST',
      }).catch(() => {
        // Ignore revocation errors
      });
    } catch {
      // Ignore
    }
  }
  clearStoredToken();
}

// ─── Drive API Operations ───

/**
 * Create or get the GradeAssist folder in the user's Drive.
 */
async function ensureGradeAssistFolder(token: string): Promise<string> {
  // Check if folder ID is cached
  const cachedFolderId = localStorage.getItem(DRIVE_FOLDER_KEY);
  if (cachedFolderId) return cachedFolderId;

  // Search for existing folder
  const searchRes = await fetch(
    `${DRIVE_API}/files?q=name='GradeAssist'+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const folderId = searchData.files[0].id;
    localStorage.setItem(DRIVE_FOLDER_KEY, folderId);
    return folderId;
  }

  // Create the folder
  const createRes = await fetch(`${DRIVE_API}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'GradeAssist',
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  const createData = await createRes.json();
  const folderId = createData.id;
  localStorage.setItem(DRIVE_FOLDER_KEY, folderId);
  return folderId;
}

/**
 * Upload a file to the user's Google Drive, inside the GradeAssist folder.
 * @param fileName - Name of the file (e.g. "Rapport_Cours_Math.txt")
 * @param content - File content as string
 * @param mimeType - MIME type (e.g. "text/plain")
 * @returns The Google Drive file ID
 */
export async function uploadToDrive(
  fileName: string,
  content: string,
  mimeType: string = 'text/plain'
): Promise<string> {
  const tokenData = getStoredToken();
  if (!tokenData) {
    throw new Error('Non connecté à Google Drive. Veuillez vous connecter d\'abord.');
  }

  const folderId = await ensureGradeAssistFolder(tokenData.accessToken);

  // Create file metadata + content in multipart upload
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: mimeType }));

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.accessToken}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      `Erreur upload Drive: ${errData.error?.message || res.statusText}`
    );
  }

  const result = await res.json();
  return result.id;
}

/**
 * Check if the token is still valid by making a test API call.
 */
export async function validateToken(): Promise<boolean> {
  const tokenData = getStoredToken();
  if (!tokenData) return false;

  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: { Authorization: `Bearer ${tokenData.accessToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
