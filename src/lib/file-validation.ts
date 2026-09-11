/**
 * [SEC-08] Validation côté client des fichiers image téléversés (logo universitaire).
 *
 * La validation par extension (.png, .jpg, .svg) est insuffisante : un attaquant peut
 * renommer n'importe quel fichier (ex: malware.exe → malware.png). On valide donc
 * également les magic bytes — premiers octets du fichier qui identifient le format
 * réel indépendamment de l'extension.
 *
 * Politique :
 * - PNG, JPEG, GIF autorisés (formats raster sans risque XSS)
 * - SVG INTERDIT (peut contenir <script>, onload=, <foreignObject>)
 * - Taille max 500 Ko (vs 2 Mo actuellement — éviter saturation localStorage)
 *
 * Référence : OWASP File Upload Cheat Sheet
 */

export type ImageFormat = "png" | "jpeg" | "gif";

export interface ValidationResult {
  valid: boolean;
  format?: ImageFormat;
  error?: string;
}

// Magic bytes signatures (premiers octets caractéristiques de chaque format)
const SIGNATURES: Array<{ format: ImageFormat; bytes: number[]; offset?: number }> = [
  // PNG : 89 50 4E 47 0D 0A 1A 0A (8 octets)
  { format: "png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // JPEG : FF D8 FF (3 octets, suivis de E0/E1/E2/E3/E8/DB selon sous-format)
  { format: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  // GIF87a : 47 49 46 38 37 61
  { format: "gif", bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },
  // GIF89a : 47 49 46 38 39 61
  { format: "gif", bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] },
];

// Taille maximale : 500 Ko
// (au-delà, le base64 dans LocalStorage sature rapidement avec plusieurs modules)
export const MAX_LOGO_SIZE_BYTES = 500 * 1024;

// Extensions autorisées (pour validation préliminaire avant magic bytes)
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif"];

/**
 * Lit les N premiers octets d'un fichier de manière asynchrone.
 */
async function readFileHeader(file: File, length: number): Promise<Uint8Array> {
  const slice = file.slice(0, length);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Compare les octets du fichier avec les signatures connues.
 */
function matchSignature(header: Uint8Array, signature: number[]): boolean {
  if (header.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (header[i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Vérifie l'extension du fichier (validation préliminaire).
 */
function hasAllowedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.some(ext => lower.endsWith(ext));
}

/**
 * Validation complète d'un fichier image téléversé.
 *
 * @param file - Le fichier File à valider
 * @returns ValidationResult avec `valid=true` + `format` si OK, sinon `valid=false` + `error`
 *
 * @example
 * ```ts
 * const result = await validateImageFile(file);
 * if (!result.valid) {
 *   toast({ variant: "destructive", title: "Fichier refusé", description: result.error });
 *   return;
 * }
 * // result.format === "png" | "jpeg" | "gif"
 * ```
 */
export async function validateImageFile(file: File): Promise<ValidationResult> {
  // 1. Vérifier la présence du fichier
  if (!file) {
    return { valid: false, error: "Aucun fichier sélectionné." };
  }

  // 2. Vérifier la taille
  if (file.size === 0) {
    return { valid: false, error: "Le fichier est vide." };
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    const sizeKB = Math.round(file.size / 1024);
    const maxKB = Math.round(MAX_LOGO_SIZE_BYTES / 1024);
    return {
      valid: false,
      error: `Fichier trop volumineux (${sizeKB} Ko). Maximum autorisé : ${maxKB} Ko.`,
    };
  }

  // 3. Vérifier l'extension (premier filtre)
  if (!hasAllowedExtension(file.name)) {
    return {
      valid: false,
      error: `Extension non autorisée. Formats acceptés : ${ALLOWED_EXTENSIONS.join(", ")}.`,
    };
  }

  // 4. [SEC-08] Rejeter explicitement SVG (même si pas dans ALLOWED_EXTENSIONS)
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return {
      valid: false,
      error: "Les fichiers SVG sont interdits pour des raisons de sécurité (risque XSS). Convertissez en PNG.",
    };
  }

  // 5. Vérifier les magic bytes (validation finale anti-spoofing)
  try {
    const header = await readFileHeader(file, 8);
    const matched = SIGNATURES.find(sig => matchSignature(header, sig.bytes));
    if (!matched) {
      return {
        valid: false,
        error: "Format de fichier invalide. Le contenu ne correspond pas à une image PNG, JPEG ou GIF.",
      };
    }
    return { valid: true, format: matched.format };
  } catch (err) {
    console.error("[file-validation] Erreur lecture header:", err);
    return {
      valid: false,
      error: "Impossible de lire le fichier. Réessayez.",
    };
  }
}

/**
 * Convertit un fichier validé en base64 Data URL pour stockage localStorage.
 *
 * @param file - Fichier préalablement validé par validateImageFile()
 * @returns Promise<string> Data URL (ex: "data:image/png;base64,...")
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier."));
    reader.readAsDataURL(file);
  });
}
