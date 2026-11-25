/**
 * Génération des rapports pédagogiques au format PDF.
 *
 * Deux règles expliquent la conception de ce module :
 *
 *  1. **jsPDF est chargé à la demande.** Un `import jsPDF from "jspdf"` en tête
 *     de composant client est aussi évalué au prérendu serveur (Next.js rend les
 *     composants `"use client"` côté serveur), où jsPDF touche `window` /
 *     `document` et fait échouer le rendu de la page. Le chargement dynamique
 *     évite ce crash et ne télécharge la bibliothèque qu'au clic.
 *
 *  2. **Le logo ne doit jamais empêcher la production du PDF.** jsPDF ne décode
 *     que le PNG et le JPEG de façon synchrone ; un logo WebP, SVG ou une URL
 *     distante lève une exception. On le convertit d'abord en PNG via un
 *     canvas, et en cas d'échec on produit simplement le rapport sans logo.
 */

export interface PedagogicalReportPdfOptions {
  /** Titre principal du rapport. */
  title: string;
  /** Paires libellé / valeur affichées sous le titre. */
  info: Array<{ label: string; value: string }>;
  /** Contenu détaillé, produit par `buildReportContent`. */
  content: string;
  /** Logo (data URL PNG/JPEG/WebP/SVG, ou URL) — facultatif. */
  logo?: string | null;
  /** Bloc de visa (enseignant + date) en fin de rapport — facultatif. */
  signature?: { name: string; date: string };
}

const PAGE_MARGIN = 14;
const BODY_FONT_SIZE = 9;
const LINE_HEIGHT = 4.3;

// jsPDF encode le texte avec les polices standard (WinAnsi). Les symboles
// typographiques utilisés dans les rapports n'y existent pas : ils sortent en
// caractères vides ou décalés. On les remplace par des équivalents ASCII.
const GLYPHS: Record<string, string> = {
  '\u2713': '[OK]', // ✓
  '\u2714': '[OK]', // ✔
  '\u25cf': '-', // ●
  '\u25cb': '-', // ○
  '\u26a0': '/!\\', // ⚠
  '\u2192': '->', // →
  '\u2013': '-', // –
  '\u2014': '-', // —
  '\u2019': "'", // ’
  '\u2018': "'", // ‘
  '\u201c': '"', // “
  '\u201d': '"', // ”
  '\u2026': '...', // …
  '\u2022': '-', // •
  '\u00a0': ' ', // espace insécable
};

function sanitizeForPdf(text: string): string {
  return String(text ?? '')
    .replace(/[\u2713\u2714\u25cf\u25cb\u26a0\u2192\u2013\u2014\u2019\u2018\u201c\u201d\u2026\u2022\u00a0]/g, (ch) => GLYPHS[ch] ?? ' ')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
}

const DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/i;

interface PreparedLogo {
  data: string;
  type: 'PNG' | 'JPEG';
}

/** Convertit n'importe quelle image affichable en PNG via un canvas. */
async function rasterizeToPng(source: string): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  return new Promise<string | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width || 512;
        const naturalHeight = img.naturalHeight || img.height || 512;
        const scale = Math.min(1, 512 / Math.max(naturalWidth, naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = source;
  });
}

async function prepareLogo(logo?: string | null): Promise<PreparedLogo | null> {
  if (!logo) return null;
  const match = DATA_URL_RE.exec(logo);
  if (match) {
    const kind = match[1].toLowerCase();
    if (kind === 'png') return { data: logo, type: 'PNG' };
    if (kind === 'jpeg' || kind === 'jpg') return { data: logo, type: 'JPEG' };
  }
  // WebP, GIF, SVG et URL distantes : passage par un canvas.
  const png = await rasterizeToPng(logo);
  return png ? { data: png, type: 'PNG' } : null;
}

const SECTION_RE = /^\s*-{2,}\s*(.+?)\s*-{2,}\s*$/;

/**
 * Construit le PDF du rapport pédagogique.
 * Rejette une erreur explicite si jsPDF lui-même n'a pas pu être chargé.
 */
export async function generatePedagogicalReportPDF(
  options: PedagogicalReportPdfOptions
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;

  const logo = await prepareLogo(options.logo);

  // Dimensions du logo calculées une seule fois (ratio réel de l'image).
  let logoWidth = 0;
  let logoHeight = 0;
  if (logo) {
    try {
      const props = doc.getImageProperties(logo.data);
      logoWidth = 22;
      logoHeight = props.width > 0 ? Math.min(18, (props.height * logoWidth) / props.width) : 12;
    } catch {
      logoWidth = 0;
      logoHeight = 0;
    }
  }

  const university = options.info.find((i) => i.label.toLowerCase().startsWith('universit'));
  const department = options.info.find((i) => i.label.toLowerCase().startsWith('département'));
  const academicYear = options.info.find((i) => i.label.toLowerCase().startsWith('année'));

  const drawHeader = (): void => {
    let headerY = PAGE_MARGIN + 2;

    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(sanitizeForPdf(university?.value || 'GradeAssist'), PAGE_MARGIN, headerY);
    headerY += 4.6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    if (department?.value) {
      doc.text(sanitizeForPdf(department.value), PAGE_MARGIN, headerY);
      headerY += 3.8;
    }
    if (academicYear?.value) {
      doc.text(`Année académique ${sanitizeForPdf(academicYear.value)}`, PAGE_MARGIN, headerY);
    }

    if (logoWidth > 0) {
      try {
        doc.addImage(
          logo!.data,
          logo!.type,
          pageWidth - PAGE_MARGIN - logoWidth,
          PAGE_MARGIN,
          logoWidth,
          logoHeight
        );
      } catch {
        // Logo illisible : le rapport reste valable sans lui.
      }
    }

    const ruleY = PAGE_MARGIN + 16;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(PAGE_MARGIN, ruleY, pageWidth - PAGE_MARGIN, ruleY);
  };

  const drawFooter = (): void => {
    const total = doc.getNumberOfPages();
    for (let page = 1; page <= total; page++) {
      doc.setPage(page);
      const footerY = pageHeight - 8;
      doc.setDrawColor(225, 225, 225);
      doc.setLineWidth(0.2);
      doc.line(PAGE_MARGIN, footerY - 4, pageWidth - PAGE_MARGIN, footerY - 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text(`GradeAssist — généré le ${new Date().toLocaleDateString('fr-FR')}`, PAGE_MARGIN, footerY);
      doc.text(`Page ${page} / ${total}`, pageWidth - PAGE_MARGIN, footerY, { align: 'right' });
    }
  };

  drawHeader();

  // ─── Titre ───
  let y = PAGE_MARGIN + 24;
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(sanitizeForPdf(options.title), contentWidth) as string[];
  doc.text(titleLines, PAGE_MARGIN, y);
  y += titleLines.length * 6.5 + 3;

  // ─── Informations générales (2 paires libellé/valeur par ligne) ───
  const pairs = options.info.filter(
    (i) => !i.label.toLowerCase().startsWith('universit') &&
      !i.label.toLowerCase().startsWith('département') &&
      !i.label.toLowerCase().startsWith('année')
  );
  const body: string[][] = [];
  for (let i = 0; i < pairs.length; i += 2) {
    const first = pairs[i];
    const second = pairs[i + 1];
    body.push([
      sanitizeForPdf(first.label),
      sanitizeForPdf(first.value),
      second ? sanitizeForPdf(second.label) : '',
      second ? sanitizeForPdf(second.value) : '',
    ]);
  }

  if (body.length > 0) {
    autoTable(doc, {
      startY: y,
      body,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2, textColor: [30, 30, 30], lineColor: [220, 220, 220] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26, fillColor: [247, 247, 247] },
        1: { cellWidth: 'auto' },
        2: { fontStyle: 'bold', cellWidth: 26, fillColor: [247, 247, 247] },
        3: { cellWidth: 'auto' },
      },
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    });
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
    y = (finalY ?? y) + 7;
  }

  // ─── Contenu détaillé ───
  const bottomLimit = pageHeight - 18;
  const ensureSpace = (needed: number): void => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      drawHeader();
      doc.setTextColor(17, 24, 39);
      y = PAGE_MARGIN + 24;
    }
  };

  // ─── Sommaire numéroté des sections ───
  let sectionIndex = 0;

  const lines = options.content.split('\n');
  for (const rawLine of lines) {
    const line = sanitizeForPdf(rawLine);

    if (line.trim() === '') {
      y += 2;
      continue;
    }

    const section = SECTION_RE.exec(line);
    if (section) {
      sectionIndex += 1;
      const heading = `${sectionIndex}. ${section[1].toUpperCase()}`;
      ensureSpace(12);
      doc.setFillColor(238, 240, 244);
      doc.rect(PAGE_MARGIN, y - 4.2, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 58, 138);
      doc.text(heading, PAGE_MARGIN + 2, y + 0.6);
      y += 8;
      continue;
    }

    const indentChars = rawLine.length - rawLine.trimStart().length;
    const indent = Math.min(indentChars, 8) * 1.1;
    const fontStyle = indentChars === 0 && /^(DÉTAIL|PAR TYPE|PAR ÉTUDIANT)/.test(rawLine.trim())
      ? 'bold'
      : 'normal';

    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(BODY_FONT_SIZE);
    doc.setTextColor(35, 35, 35);

    const wrapped = doc.splitTextToSize(line.trimStart(), contentWidth - indent) as string[];
    for (const part of wrapped) {
      ensureSpace(LINE_HEIGHT);
      doc.text(part, PAGE_MARGIN + indent, y);
      y += LINE_HEIGHT;
    }
  }

  // ─── Visa de l'enseignant ───
  if (options.signature) {
    const boxHeight = 28;
    ensureSpace(boxHeight + 8);
    y += 6;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(PAGE_MARGIN, y, contentWidth, boxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 58, 138);
    doc.text("VISA DE L'ENSEIGNANT", PAGE_MARGIN + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text(sanitizeForPdf(options.signature.name), PAGE_MARGIN + 4, y + 12);
    doc.text(`Fait le ${sanitizeForPdf(options.signature.date)}`, pageWidth - PAGE_MARGIN - 4, y + 12, { align: 'right' });

    doc.setDrawColor(120, 120, 120);
    doc.line(PAGE_MARGIN + 4, y + 22, PAGE_MARGIN + 64, y + 22);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text('Signature et cachet', PAGE_MARGIN + 4, y + 26);

    y += boxHeight + 4;
  }

  drawFooter();

  const blob = doc.output('blob');
  if (!blob || blob.size === 0) {
    throw new Error("Le PDF généré est vide. Vérifiez les données du rapport.");
  }
  return blob;
}
