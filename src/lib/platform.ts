/**
 * Détection de l'environnement d'exécution.
 *
 * GradeAssist est distribué sous trois formes :
 *  - navigateur (web, PWA installée depuis Chrome) ;
 *  - application Android : une WebView Capacitor qui charge l'URL distante ;
 *  - application Windows : Electron.
 *
 * La détection conditionne l'enregistrement des documents : la WebView Android
 * ignore silencieusement un `<a download>`.
 *
 * On interroge `Capacitor` importé depuis `@capacitor/core` plutôt que la
 * variable globale `window.Capacitor`. Le paquet expose la même passerelle mais
 * sait retomber sur la détection de plateforme quand l'injection globale n'a
 * pas encore eu lieu — ce qui arrive dans une WebView qui charge une URL
 * distante, et faisait prendre le chemin web (donc `mailto:`, donc pas de
 * pièce jointe).
 */

import { Capacitor } from "@capacitor/core";

/** Vrai dans l'application Android (WebView Capacitor). */
export function isNativeShell(): boolean {
  try {
    if (Capacitor.isNativePlatform()) return true;
    if (Capacitor.getPlatform() !== "web") return true;
  } catch {
    // Passerelle indisponible : on tente le repli ci-dessous.
  }

  // Repli : une WebView Android se reconnaît au marqueur « ; wv) » de son
  // user-agent.
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
