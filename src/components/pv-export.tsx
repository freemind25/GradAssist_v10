"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EvaluationData } from "@/types";

interface PvExportProps {
  evaluationData: EvaluationData;
  moduleName: string;
}

export function PvExport({ evaluationData, moduleName }: PvExportProps) {
  const { toast } = useToast();

  const generatePv = () => {
    const d = evaluationData;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;

    // ── Colors ──
    const primaryColor: [number, number, number] = [30, 80, 140];
    const darkText: [number, number, number] = [30, 30, 30];
    const grayText: [number, number, number] = [100, 100, 100];

    // ══════════════════════════════════════════════════════════════
    //  HEADER — Official Algerian University Format
    // ══════════════════════════════════════════════════════════════

    let yPos = 10;

    // ── Left header: Republic info ──
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkText);
    doc.text("Republique Algerienne Democratique et Populaire", margin, yPos);
    yPos += 4;

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Ministere de l'Enseignement Superieur et de la Recherche Scientifique", margin, yPos);
    yPos += 4;

    // University name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(d.universityName || "Universite de Constantine 3", margin, yPos);
    yPos += 5;

    // Institute
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(d.establishmentName || "Institut de Gestion et Techniques Urbaines", margin, yPos);
    yPos += 4;

    // Department
    doc.text(d.departmentName || "Departement de Gestion des Villes et l'Urbanisation", margin, yPos);

    // ── Right header: Logo + Arabic text ──
    if (d.universityLogo) {
      try {
        const img = new window.Image();
        img.src = d.universityLogo;
        const logoWidth = 22;
        const logoHeight = (img.height * logoWidth) / img.width;
        doc.addImage(d.universityLogo, "PNG", pageWidth - margin - logoWidth, 8, logoWidth, logoHeight);
      } catch {
        // Logo not loaded
      }
    }

    // Arabic header text (right-aligned)
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayText);
    const arabicLines = [
      "الجمهورية الجزائرية الديمقراطية الشعبية",
      "وزارة التعليم العالي والبحث العلمي",
      d.universityName || "جامعة قسنطينة 3",
    ];
    let arabicY = 10;
    arabicLines.forEach((line) => {
      doc.text(line, pageWidth - margin - 24, arabicY, { align: "right" });
      arabicY += 4;
    });

    // ── Separator line ──
    yPos = Math.max(yPos, arabicY) + 2;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    // ══════════════════════════════════════════════════════════════
    //  METADATA FIELDS
    // ══════════════════════════════════════════════════════════════

    doc.setFontSize(8);
    doc.setTextColor(...darkText);

    const leftCol = margin;
    const midCol = pageWidth / 2;

    // Left column
    doc.setFont("helvetica", "bold");
    doc.text("Annee Academique:", leftCol, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(d.academicYear || "2025/2026", leftCol + 32, yPos);

    doc.setFont("helvetica", "bold");
    doc.text("Filiere:", leftCol, yPos + 5);
    doc.setFont("helvetica", "normal");
    doc.text(d.masterSpecialty || "Gestion des techniques urbaines", leftCol + 18, yPos + 5);

    doc.setFont("helvetica", "bold");
    doc.text("Specialite:", leftCol, yPos + 10);
    doc.setFont("helvetica", "normal");
    doc.text(d.departmentName || "gestion des villes", leftCol + 22, yPos + 10);

    doc.setFont("helvetica", "bold");
    doc.text("Niveau:", leftCol, yPos + 15);
    doc.setFont("helvetica", "normal");
    doc.text(
      d.studyLevel && d.studySubLevel ? `${d.studyLevel} ${d.studySubLevel}` : "Master 1",
      leftCol + 16,
      yPos + 15
    );

    // Right column
    doc.setFont("helvetica", "bold");
    doc.text("Domaine:", midCol, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(d.departmentName || "........................................", midCol + 20, yPos);

    doc.setFont("helvetica", "bold");
    doc.text("Periode:", midCol, yPos + 5);
    doc.setFont("helvetica", "normal");
    doc.text(d.session || "Semestre 2", midCol + 18, yPos + 5);

    doc.setFont("helvetica", "bold");
    doc.text("Enseignant:", midCol, yPos + 10);
    doc.setFont("helvetica", "normal");
    doc.text(d.teacherNames.filter((n) => n.trim()).join(", ") || "SADI Messaoud", midCol + 24, yPos + 10);

    doc.setFont("helvetica", "bold");
    doc.text("Section/Groupe:", midCol, yPos + 15);
    doc.setFont("helvetica", "normal");
    doc.text("Section A / (Groupe A)", midCol + 30, yPos + 15);

    // ── Matière line (full width) ──
    yPos += 22;
    doc.setFont("helvetica", "bold");
    doc.text("Matiere:", leftCol, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(moduleName || "Atelier 2 : Projets de ville 2", leftCol + 18, yPos);

    // ══════════════════════════════════════════════════════════════
    //  TITLE
    // ══════════════════════════════════════════════════════════════

    yPos += 8;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 4, contentWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text("PV des notes CC par matiere (Enseignant)", pageWidth / 2, yPos + 1, { align: "center" });

    // ══════════════════════════════════════════════════════════════
    //  GRADES TABLE
    // ══════════════════════════════════════════════════════════════

    yPos += 8;

    const studentNames = d.studentNames.filter((n) => n.trim());

    // Build table data
    const tableRows: (string | number)[][] = studentNames.map((name, i) => {
      const parts = name.split(" ");
      const nom = parts.length > 1 ? parts[0] : name;
      const prenom = parts.length > 1 ? parts.slice(1).join(" ") : "";
      return [
        i + 1,
        `${222234}${String(100000 + i).slice(1)}`, // Matricule placeholder
        nom.toUpperCase(),
        prenom,
        "",
        "",
        "",
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Matricule", "Nom", "Prenom", "Note CC", "Note corrigee", "Signature"]],
      body: tableRows,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        halign: "center",
        lineColor: [180, 180, 180],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 28, halign: "center", font: "helvetica", fontSize: 7 },
        2: { cellWidth: 35, halign: "left", fontStyle: "bold" },
        3: { cellWidth: 35, halign: "left" },
        4: { cellWidth: 22, halign: "center" },
        5: { cellWidth: 22, halign: "center" },
        6: { cellWidth: 30, halign: "center" },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        // Style alternating rows
        if (data.section === "body" && data.row.index % 2 === 1) {
          data.cell.styles.fillColor = [243, 244, 246];
        }
      },
    });

    // ══════════════════════════════════════════════════════════════
    //  FOOTER
    // ══════════════════════════════════════════════════════════════

    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || pageHeight - 30;

    if (finalY + 20 < pageHeight) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayText);
      doc.text(`Fait le ${new Date().toLocaleDateString("fr-FR")}`, margin, finalY + 8);
      doc.text("Signature de l'enseignant:", pageWidth - margin - 50, finalY + 8);
      doc.line(pageWidth - margin - 50, finalY + 12, pageWidth - margin, finalY + 12);
    }

    // ── Save ──
    const filename = `PV_notes_${moduleName.replace(/\s/g, "_")}_${d.academicYear || "2025-2026"}.pdf`;
    doc.save(filename);

    toast({
      title: "PV Exporté",
      description: `Le fichier "${filename}" a été téléchargé.`,
    });
  };

  return (
    <Button
      onClick={generatePv}
      variant="outline"
      size="sm"
      className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
    >
      <FileDown className="h-4 w-4" />
      PV des Notes
    </Button>
  );
}
