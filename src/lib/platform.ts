/**
 * Détection de l'environnement d'exécution.
 *
 * GradeAssist est distribué sous trois formes :
 *  - navigateur (web, PWA installée depuis Chrome) ;
 *  - application Android : une WebView Capacitor qui charge l'URL distante ;
 *  - application Windows : Electron, qui charge la même URL.
 *
 * Cette distinction est indispensable aux exports : la WebView Android
 * n'implémente pas le téléchargement de fichiers. Un `<a download>` ou un
 * `doc.save()` y est silencieusement ignoré — la promesse est rejetée sans
 * erreur, alors que l'ancien code affichait malgré tout « fichier exporté ».
 */

interface CapacitorBridge {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

function getCapacitor(): CapacitorBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: CapacitorBridge }).Capacitor;
}

/** Vrai dans l'application Android (WebView Capacitor). */
export function isNativeShell(): boolean {
  const bridge = getCapacitor();
  if (bridge?.isNativePlatform?.()) return true;

  // Repli : une WebView Android se reconnaît au marqueur « ; wv) » de son
  // user-agent. Utile si le pont Capacitor n'est pas encore injecté au moment
  // où l'utilisateur déclenche l'export.
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android/i.test(ua) && /;\s*wv\)/i.test(ua);
}

/** Vrai dans l'application Windows (Electron). */
export function isElectronShell(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Electron/i.test(navigator.userAgent || "");
}

/**
 * Vrai si le navigateur sait enregistrer un fichier déclenché par un clic
 * programmatique. Faux dans la WebView Android.
 */
export function canDownloadFiles(): boolean {
  return !isNativeShell();
}
