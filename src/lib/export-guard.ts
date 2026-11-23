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

export interface ShareOptions {
  /** Titre du document (objet du mail sur Android). */
  title: string;
  /** Texte accompagnant le partage. */
  text?: string;
  /** Destinataire du repli `mailto:` sur le web. */
  mailTo?: string;
  dialogTitle?: string;
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
    const path = `GradeAssist/${fileName}`;

    // Android 11+ interdit l'écriture dans le dossier Documents public :
    // l'appel échoue avec une erreur de permission. On réessaie dans le cache
    // applicatif, toujours accessible, puis on passe par la feuille de partage
    // qui, elle, laisse l'utilisateur choisir la destination réelle.
    let written;
    try {
      written = await Filesystem.writeFile({
        path,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });
    } catch {
      written = await Filesystem.writeFile({
        path,
        data: base64,
        directory: Directory.Cache,
        recursive: true,
      });
    }

    toast({
      title: "Document prêt",
      description: `${fileName} — utilisez le partage pour l'enregistrer dans vos fichiers, votre Drive ou un mail.`,
    });

    // La feuille de partage sert de « Enregistrer sous ». Un refus de
    // l'utilisateur n'est pas une erreur : le document reste disponible dans
    // le cache de l'application jusqu'au prochain nettoyage du système.
    try {
      await Share.share({
        title: fileName,
        // `files` est le seul champ qui joint réellement le fichier : `url`
        // transmet un lien, que Gmail affiche comme du texte (« fichier
        // introuvable » ou simple mention du nom).
        files: [written.uri],
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

/**
 * Partage le document (e-mail, Drive, messagerie).
 *
 * Sur Android, la feuille de partage reçoit le **fichier lui-même** : Gmail
 * s'ouvre avec la pièce jointe réelle. C'est la seule façon d'envoyer un PDF
 * depuis une application web — un lien `mailto:` ne transporte que du texte.
 *
 * Sur le web, `navigator.share` fait de même quand il accepte des fichiers ;
 * sinon le document est téléchargé et un message explique qu'il faut le
 * joindre manuellement.
 */
export async function shareDocument(
  fileName: string,
  data: Blob,
  options: ShareOptions
): Promise<void> {
  if (!isNativeShell()) {
    const file = new File([data], fileName, { type: data.type || "application/pdf" });
    const nav = navigator as Navigator & {
      canShare?: (payload: ShareData) => boolean;
      share?: (payload: ShareData) => Promise<void>;
    };

    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: options.title, text: options.text });
        return;
      } catch {
        return; // partage annulé par l'utilisateur
      }
    }

    triggerBrowserDownload(data, fileName);
    if (options.mailTo) {
      const params = new URLSearchParams({ subject: options.title });
      if (options.text) params.set("body", options.text);
      window.open(`mailto:${options.mailTo}?${params.toString()}`, "_blank");
    }
    toast({
      title: "Fichier téléchargé",
      description:
        "Un lien mailto ne peut pas transporter de pièce jointe : joignez le document téléchargé à votre message.",
    });
    return;
  }

  try {
    const { Directory, Filesystem } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");

    const base64 = await blobToBase64(data);
    const path = `GradeAssist/${fileName}`;

    let written;
    try {
      written = await Filesystem.writeFile({
        path,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });
    } catch {
      written = await Filesystem.writeFile({
        path,
        data: base64,
        directory: Directory.Cache,
        recursive: true,
      });
    }

    await Share.share({
      title: options.title,
      text: options.text,
      files: [written.uri],
      dialogTitle: options.dialogTitle ?? "Envoyer le document",
    });
  } catch (error) {
    console.error("Échec du partage du document :", error);
    toast({
      variant: "destructive",
      title: "Envoi impossible",
      description:
        "Le document n'a pas pu être préparé. Essayez de l'enregistrer d'abord, puis de le joindre depuis votre messagerie.",
    });
  }
}
