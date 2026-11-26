/**
 * Stockage des PDF de canevas dans IndexedDB — une entrée par module.
 *
 * Auparavant tout était écrit sous la clé unique « current_pdf » : importer le
 * canevas d'un module écrasait silencieusement celui des autres, alors que
 * leur nom de fichier restait affiché. L'ancienne clé est encore lue une fois
 * par module, pour migrer les données existantes.
 */
const DB_NAME = 'GradeAssist_Syllabus';
const DB_STORE = 'pdfs';

/** Ancienne clé unique, conservée pour la migration. */
export const LEGACY_DB_KEY = 'current_pdf';

export function pdfKey(moduleId: string): string {
  return `pdf:${moduleId}`;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('No window'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePdfToIDB(
  key: string,
  dataUrl: string | null
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    if (dataUrl) {
      store.put(dataUrl, key);
    } else {
      store.delete(key);
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function loadPdfFromIDB(key: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const req = store.get(key);
    req.onsuccess = () => {
      db.close();
      resolve(req.result ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

/**
 * Décode un data URL (`data:application/pdf;base64,...`) en octets, sans
 * requête réseau. `fetch()` est bloqué par la CSP de production
 * (connect-src 'self'), d'où le décodage local.
 */
export function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; mime: string } {
  const parts = dataUrl.split(',');
  if (parts.length < 2) {
    throw new Error('Contenu PDF illisible (data URL malformée)');
  }
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, mime };
}

/** Blob URL pour iframe/ouverture d'onglet, sans data URL géante. */
export function dataUrlToBlobUrl(dataUrl: string): string {
  const { bytes, mime } = decodeDataUrl(dataUrl);
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return URL.createObjectURL(new Blob([buffer], { type: mime }));
}
