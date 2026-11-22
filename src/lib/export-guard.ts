"use client";

import { toast } from "@/hooks/use-toast";
import { isNativeShell } from "@/lib/platform";

/**
 * Enregistrement d'un document produit par l'application.
 *
 * Deux environnements, deux mécanismes :
 *
 *  - **Navigateur / PWA** : un `<a download>` sur une URL `blob:` déclenche le
 *    téléchargement habituel.
 *  - **Application Android (WebView)** : cette manœuvre est ignorée sans
 *    erreur. On écrit donc le fichier dans `Documents/GradeAssist/` via le
 *    plugin Filesystem, puis on ouvre la feuille de partage Android pour que
 *    l'utilisateur choisisse où le conserver (Fichiers, Drive, mail…).
 *
 * C'est la feuille de partage qui sert de « Enregistrer sous » : elle indique
 * explicitement le chemin, ce que le téléchargement silencieux ne faisait pas.
 */

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Lecture impossible"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Enregistre le document et prévient l'utilisateur de l'endroit exact.
 * Ne lève jamais : en cas d'échec, un message explicite est affiché.
 */
export async function saveDocument(fileName: string, data: Blob): Promise<void> {
  if (!isNativeShell()) {
    triggerBrowserDownload(data, fileName);
    toast({
      title: "Téléchargement lancé",
      description: `${fileName} — vérifiez le dossier Téléchargements de votre appareil.`,
    });
    return;
  }

  try {
    const { Directory, Filesystem } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");

    const base64 = await blobToBase64(data);
    const written = await Filesystem.writeFile({
      path: `GradeAssist/${fileName}`,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    });

    toast({
      title: "Document enregistré",
      description: `${fileName} — dossier Documents/GradeAssist de votre téléphone.`,
    });

    // La feuille de partage permet d'envoyer le fichier ailleurs (Drive, mail)
    // ou de le copier dans un autre dossier. Un refus de l'utilisateur n'est
    // pas une erreur : le fichier reste dans Documents/GradeAssist.
    try {
      await Share.share({
        title: fileName,
        url: written.uri,
        dialogTitle: "Enregistrer ou partager le document",
      });
    } catch {
      // Partage annulé : sans conséquence.
    }
  } catch (error) {
    console.error("Échec de l'enregistrement du document :", error);
    toast({
      variant: "destructive",
      title: "Enregistrement impossible",
      description:
        "Le document n'a pas pu être écrit sur l'appareil. Vérifiez l'espace disponible, ou ouvrez GradeAssist dans Chrome pour télécharger.",
    });
  }
}
