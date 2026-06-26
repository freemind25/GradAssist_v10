/**
 * Service centralisé pour l'export PDF et CSV
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Criterion, SelectedGrades, EvaluationData } from "@/types";
import { toast } from "@/hooks/use-toast";
import { getPointsForSelectedGrade, NON_NOTE_VALUE } from "@/lib/grading";

const BASE_DOCUMENT_TITLE_PREFIX = "Fiche d'évaluation des travaux de l'atelier";

interface ExportIndividualParams {
  criteria: Criterion[];
  selectedGrades: SelectedGrades;
  studentNames: string[];
  teacherNames: string[];
  projectName: string;
  studyLevel: string;
  studySubLevel: string;
  session: string;
  academicYear: string;
  universityName: string;
  establishmentName: string;
  departmentName: string;
  masterSpecialty: string;
  universityLogo: string | null;
  totalPoints: number;
  maxTotalPoints: number;
  evaluationSheetTitleComplement: string;
}

interface ExportSummaryParams {
  allEvaluations: EvaluationData[];
  maxTotalPoints: number;
  moduleName: string;
}

const generateFileNameBase = (studentNames: string[]): string => {
  const primaryStudentName = (studentNames[0] || 'etudiant').replace(/\s+/g, '_');
  return studentNames.length > 1 ? `${primaryStudentName}_et_autres` : primaryStudentName;
};

const generateSummaryFileNameBase = (moduleName: string): string => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `synthese_evaluations_${moduleName.replace(/\s/g, '_')}_${dateStr}`;
};

const getDocumentTitle = (complement: string): string => {
  return `${BASE_DOCUMENT_TITLE_PREFIX} ${complement || '...............................................................'}`;
};

const getImageTypeFromBase64 = (base64: string): string => {
  const match = base64.match(/^data:image\/(png|jpe?g|svg\+xml);base64,/);
  if (match?.[1]) {
    if (match[1] === 'jpeg' || match[1] === 'jpg') return 'JPEG';
    if (match[1] === 'svg+xml') return 'SVG';
    return match[1].toUpperCase();
  }
  return 'PNG';
};

const addLogoToPDF = (doc: jsPDF, logo: string, yPos: number, pageWidth: number, pageMargin: number): number => {
  try {
    const img = new window.Image();
    img.src = logo;
    const imageType = getImageTypeFromBase64(logo);
    const logoWidth = 25;
    const logoHeight = (img.height * logoWidth) / img.width;
    doc.addImage(logo, imageType, pageWidth - pageMargin - logoWidth, yPos, logoWidth, logoHeight);
    return yPos + logoHeight + 5;
  } catch (e) {
    console.error("Error adding logo to PDF:", e);
    toast({ variant: "destructive", title: "Erreur Logo", description: "Impossible d'ajouter le logo au PDF." });
    return yPos;
  }
};

const downloadFile = (content: string, filename: string): void => {
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(content));
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const csvCell = (value: string | number | null | undefined): string => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const csvRow = (cells: Array<string | number | null | undefined>): string => {
  return `${cells.map(csvCell).join(",")}\n`;
};

export const exportIndividualCSV = (params: ExportIndividualParams): void => {
  const { criteria, selectedGrades, studentNames, teacherNames, projectName, studyLevel, studySubLevel, session, academicYear, universityName, establishmentName, departmentName, masterSpecialty, universityLogo, totalPoints, maxTotalPoints, evaluationSheetTitleComplement } = params;

  let csv = `data:text/csv;charset=utf-8,${csvRow([getDocumentTitle(evaluationSheetTitleComplement)])}`;
  if (universityLogo) csv += csvRow(["Logo Université:", "(Logo fourni)"]);
  csv += csvRow(["Université:", universityName || "N/A"]);
  csv += csvRow(["Établissement:", establishmentName || "N/A"]);
  csv += csvRow(["Département:", departmentName || "N/A"]);
  csv += csvRow(["Niveau d'étude:", studyLevel ? `${studyLevel} - ${studySubLevel}` : "N/A"]);
  if (studyLevel === "Master") csv += csvRow(["Spécialité Master:", masterSpecialty || "N/A"]);
  
  csv += csvRow(["Nom de l'étudiant(e/s):", studentNames.filter(n => n.trim()).join(", ") || "N/A"]);
  csv += csvRow(["Nom de l'enseignant(e/s):", teacherNames.filter(n => n.trim()).join(", ") || "N/A"]);
  csv += csvRow(["Intitulé du Projet:", projectName || "N/A"]);
  csv += csvRow(["Session:", session || "N/A"]);
  csv += csvRow(["Année Universitaire:", academicYear || "N/A"]);
  csv += "\n";
  csv += csvRow(["Critère", "Coefficient", "Note Attribuée", "Points Obtenus"]);

  criteria.forEach(c => {
    const grade = selectedGrades[c.id];
    const displayGrade = (grade && grade !== NON_NOTE_VALUE && c.coefficient > 0) ? grade : "N/A";
    const points = c.coefficient > 0 ? getPointsForSelectedGrade(grade) : 0;
    csv += csvRow([c.name, c.coefficient, displayGrade, points.toFixed(2)]);
  });

  csv += "\n";
  csv += csvRow(["Total des Points", "", " ", totalPoints.toFixed(2)]);
  csv += csvRow(["Sur", "", " ", maxTotalPoints.toFixed(2)]);
  downloadFile(csv, `evaluation_${generateFileNameBase(studentNames)}.csv`);
  toast({ title: "Succès", description: "Fichier CSV exporté." });
};

export const exportSummaryCSV = (params: ExportSummaryParams): void => {
  const { allEvaluations, maxTotalPoints, moduleName } = params;

  if (allEvaluations.length === 0) {
    toast({ variant: "destructive", title: "Aucune Donnée", description: "Aucune évaluation à exporter." });
    return;
  }

  const first = allEvaluations[0];
  let csv = `data:text/csv;charset=utf-8,${csvRow([`Synthèse des Évaluations - ${moduleName}`])}`;
  if (first.evaluationSheetTitleComplement && first.evaluationSheetTitleComplement !== "...............................................................") {
    csv += csvRow(["Contexte:", first.evaluationSheetTitleComplement]);
  }
  csv += csvRow(["Université:", first.universityName || "N/A"]);
  csv += csvRow(["Établissement:", first.establishmentName || "N/A"]);
  csv += csvRow(["Département:", first.departmentName || "N/A"]);
  csv += "\n";
  csv += csvRow(["N°", "Nom de l'étudiant(e/s)", "Nom de l'enseignant(e/s)", "Intitulé du Projet", "Niveau d'étude", "Spécialité Master", "Session", "Année Universitaire", "Note Finale", "Sur"]);

  allEvaluations.forEach((e, i) => {
    const students = e.studentNames.filter(n => n.trim()).join(' & ') || 'N/A';
    const teachers = e.teacherNames.filter(n => n.trim()).join(' & ') || 'N/A';
    const level = e.studyLevel ? `${e.studyLevel} - ${e.studySubLevel}` : 'N/A';
    csv += csvRow([i + 1, students, teachers, e.projectName || "N/A", level, e.masterSpecialty || "N/A", e.session || "N/A", e.academicYear || "N/A", e.totalPoints.toFixed(2), maxTotalPoints.toFixed(2)]);
  });

  downloadFile(csv, `${generateSummaryFileNameBase(moduleName)}.csv`);
  toast({ title: "Succès", description: "Synthèse CSV exportée." });
};

export const exportIndividualPDF = (params: ExportIndividualParams): void => {
  const { criteria, selectedGrades, studentNames, teacherNames, projectName, studyLevel, studySubLevel, session, academicYear, universityName, establishmentName, departmentName, masterSpecialty, universityLogo, totalPoints, maxTotalPoints, evaluationSheetTitleComplement } = params;

  const doc = new jsPDF();
  let yPos = 15;
  const lineHeight = 6;
  const pageMargin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();

  if (universityLogo) yPos = addLogoToPDF(doc, universityLogo, yPos, pageWidth, pageMargin);

  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(getDocumentTitle(evaluationSheetTitleComplement), pageWidth - (pageMargin * 2) - (universityLogo ? 30 : 0));
  doc.text(titleLines, pageMargin, yPos);
  yPos += lineHeight * titleLines.length + (titleLines.length > 1 ? 2 : 4);
  
  doc.setFontSize(11);
  const addLine = (text: string) => { doc.text(text, pageMargin, yPos); yPos += lineHeight; };
  addLine(`Université: ${universityName || 'N/A'}`);
  addLine(`Établissement: ${establishmentName || 'N/A'}`);
  addLine(`Département: ${departmentName || 'N/A'}`);
  addLine(`Niveau d'étude: ${studyLevel ? `${studyLevel} - ${studySubLevel}`: 'N/A'}`);
  if (studyLevel === "Master") addLine(`Spécialité Master: ${masterSpecialty || 'N/A'}`);
  
  addLine(`Nom de l'étudiant(e/s): ${studentNames.filter(n => n.trim()).join(', ') || 'N/A'}`);
  addLine(`Nom de l'enseignant(e/s): ${teacherNames.filter(n => n.trim()).join(', ') || 'N/A'}`);
  addLine(`Intitulé du Projet: ${projectName || 'N/A'}`);
  addLine(`Session: ${session || 'N/A'}`);
  addLine(`Année Universitaire: ${academicYear || 'N/A'}`);
  
  const tableRows: (string | number)[][] = criteria.map(c => {
    const grade = selectedGrades[c.id];
    const displayGrade = (grade && grade !== NON_NOTE_VALUE && c.coefficient > 0) ? grade : "N/A";
    const points = c.coefficient > 0 ? getPointsForSelectedGrade(grade) : 0;
    return [`${c.name}${c.details ? '\\n(' + c.details.replace(/\n/g, '\\n') + ')' : ''}`, c.coefficient, displayGrade, points.toFixed(2)];
  });

  autoTable(doc, {
    head: [["Critère d'Évaluation", "Coeff.", "Note Attribuée", "Points Obtenus"]],
    body: tableRows,
    startY: yPos + 2,
    theme: 'grid',
    styles: { halign: 'left' as const, fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: [30, 130, 100] as [number, number, number], textColor: 255, fontStyle: 'bold' as const, halign: 'center' as const },
    columnStyles: { 0: { cellWidth: 'auto' as const, halign: 'left' as const }, 1: { cellWidth: 15, halign: 'center' as const }, 2: { cellWidth: 35, halign: 'center' as const }, 3: { cellWidth: 30, halign: 'center' as const } },
    didParseCell: (data) => { if (data.column.index === 0 && typeof data.cell.raw === 'string' && data.cell.raw.includes('\\n')) data.cell.styles.valign = 'middle'; }
  });
  
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Note Finale: ${totalPoints.toFixed(2)} / ${maxTotalPoints.toFixed(2)}`, pageMargin, finalY + 10);
  doc.save(`evaluation_${generateFileNameBase(studentNames)}.pdf`);
  toast({ title: "Succès", description: "Fichier PDF exporté." });
};

export const exportSummaryPDF = (params: ExportSummaryParams): void => {
  const { allEvaluations, maxTotalPoints, moduleName } = params;

  if (allEvaluations.length === 0) {
    toast({ variant: "destructive", title: "Aucune Donnée", description: "Aucune évaluation à exporter." });
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape' });
  let yPos = 15;
  const lineHeight = 7;
  const pageMargin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const first = allEvaluations[0];
  
  if (first.universityLogo) {
    try {
      const img = new window.Image();
      img.src = first.universityLogo;
      const imageType = getImageTypeFromBase64(first.universityLogo);
      const logoWidth = 20;
      const logoHeight = (img.height * logoWidth) / img.width;
      doc.addImage(first.universityLogo, imageType, pageWidth - pageMargin - logoWidth, yPos, logoWidth, logoHeight);
      yPos = Math.max(yPos, yPos + logoHeight - 10);
    } catch (e) { console.error("Error adding logo:", e); }
  }
  
  doc.setFontSize(16);
  doc.text(`Synthèse des Évaluations - ${moduleName}`, pageMargin, yPos); 
  yPos += lineHeight * 1.5;
  
  doc.setFontSize(10);
  const addLine = (text: string, factor = 0.8) => { doc.text(text, pageMargin, yPos); yPos += lineHeight * factor; };
  if (first.evaluationSheetTitleComplement && first.evaluationSheetTitleComplement !== "...............................................................") {
    addLine(`Contexte: ${first.evaluationSheetTitleComplement}`);
  }
  addLine(`Université: ${first.universityName || 'N/A'}`);
  addLine(`Établissement: ${first.establishmentName || 'N/A'}`);
  addLine(`Département: ${first.departmentName || 'N/A'}`, 1.2);

  const tableRows: (string | number)[][] = allEvaluations.map((e, i) => [
    i + 1,
    e.studentNames.filter(n => n.trim()).join(' & ') || 'N/A',
    e.teacherNames.filter(n => n.trim()).join(' & ') || 'N/A',
    e.projectName || 'N/A',
    e.studyLevel ? `${e.studyLevel} - ${e.studySubLevel}` : 'N/A',
    e.masterSpecialty || 'N/A',
    e.session || 'N/A',
    e.academicYear || 'N/A',
    e.totalPoints.toFixed(2),
  ]);

  autoTable(doc, {
    head: [["N°", "Étudiant(e/s)", "Enseignant(e/s)", "Projet", "Niveau", "Spécialité", "Sess.", "Année Univ.", `Note (/${maxTotalPoints.toFixed(2)})`]],
    body: tableRows,
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [30, 130, 100] as [number, number, number], textColor: 255, fontStyle: 'bold' as const, halign: 'center' as const },
    columnStyles: { 0: { cellWidth: 8, halign: 'center' as const }, 1: { cellWidth: 40, halign: 'left' as const }, 2: { cellWidth: 40, halign: 'left' as const }, 3: { cellWidth: 'auto' as const, halign: 'left' as const }, 4: { cellWidth: 18, halign: 'center' as const }, 5: { cellWidth: 20, halign: 'left' as const }, 6: { cellWidth: 10, halign: 'center' as const }, 7: { cellWidth: 16, halign: 'center' as const }, 8: { cellWidth: 15, halign: 'center' as const, fontStyle: 'bold' as const } },
  });

  doc.save(`${generateSummaryFileNameBase(moduleName)}.pdf`);
  toast({ title: "Succès", description: "Synthèse PDF exportée." });
};
