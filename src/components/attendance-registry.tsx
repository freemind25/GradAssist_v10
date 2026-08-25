
"use client";

import type * as React from 'react';
import { useState } from 'react';
import { format, getMonth, getYear, endOfMonth, eachDayOfInterval, parseISO, startOfMonth, compareAsc } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, XCircle, Clock, FileText, UserCheck, Download, Calendar as CalendarIcon, FileBarChart, Mail, Send } from "lucide-react";
import type { AttendanceData, AttendanceStatus } from "@/types";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';

interface AttendanceRegistryProps {
    students: string[];
    attendance: AttendanceData;
    setAttendance: (attendance: AttendanceData) => void;
    establishmentName: string;
    departmentName: string;
    studyLevel: string;
    studySubLevel: string;
    teacherNames: string[];
    universityLogo: string | null;
    moduleName: string;
    adminEmail?: string;
    setAdminEmail?: (email: string) => void;
}

const statusOptions: { value: AttendanceStatus; label: string; icon: React.ElementType, colorClass: string, symbol: string }[] = [
    { value: 'present', label: 'Présent', icon: CheckCircle2, colorClass: 'text-green-600', symbol: 'P' },
    { value: 'absent', label: 'Absent', icon: XCircle, colorClass: 'text-red-600', symbol: 'A' },
    { value: 'late', label: 'En retard', icon: Clock, colorClass: 'text-orange-600', symbol: 'R' },
    { value: 'excused', label: 'Excusé', icon: FileText, colorClass: 'text-blue-600', symbol: 'E' },
];

const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export function AttendanceRegistry({ 
    students, 
    attendance, 
    setAttendance,
    establishmentName,
    departmentName,
    studyLevel,
    studySubLevel,
    teacherNames,
    universityLogo,
    moduleName,
    adminEmail = "",
    setAdminEmail,
}: AttendanceRegistryProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [showRegistry, setShowRegistry] = useState(false);
    const { toast } = useToast();
    
    const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

    const handleStatusChange = (studentName: string, status: AttendanceStatus) => {
        if (!selectedDateKey || !studentName) return;
        const newAttendance: AttendanceData = { ...attendance };
        if (!newAttendance[selectedDateKey]) {
            newAttendance[selectedDateKey] = {};
        }
        newAttendance[selectedDateKey][studentName] = status;
        setAttendance(newAttendance);
    };
    
    const getMonthlyReportData = (month: number, year: number, concise: boolean = false) => {
        const monthStartDate = startOfMonth(new Date(year, month));
        const monthEndDate = endOfMonth(monthStartDate);
        const allDaysInMonth = eachDayOfInterval({ start: monthStartDate, end: monthEndDate });

        const recordedDaysInMonth = Object.keys(attendance)
            .map(dateKey => parseISO(dateKey))
            .filter(date => getYear(date) === year && getMonth(date) === month)
            .sort(compareAsc);

        const daysToReport = concise ? recordedDaysInMonth : allDaysInMonth;
        
        if (concise && daysToReport.length === 0) {
             return { studentReports: [], recordedDays: [], month, year };
        }

        const studentReports = students.map((studentName, index) => {
            let absenceCount = 0;
            const dailyStatuses: { [day: number]: string } = {};

            daysToReport.forEach(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayOfMonth = day.getDate();
                
                // Correction : Vérifier d'abord si un statut est enregistré pour cette date précise
                const status = (attendance[dateKey] && attendance[dateKey][studentName]) || 'present';

                const statusInfo = statusOptions.find(s => s.value === status);
                dailyStatuses[dayOfMonth] = statusInfo?.symbol || 'P'; 
                
                if (status === 'absent') {
                    absenceCount++;
                }
            });

            return {
                id: index + 1,
                name: studentName,
                dailyStatuses,
                absenceCount,
            };
        });

        return {
            studentReports,
            recordedDays: daysToReport,
            month,
            year,
        };
    };

    const handleExportCSV = () => {
        if (!selectedDate) {
             toast({ variant: "destructive", title: "Aucune Date", description: "Veuillez sélectionner une date." });
            return;
        }
        const { studentReports, recordedDays, month, year } = getMonthlyReportData(getMonth(selectedDate), getYear(selectedDate));
        const monthName = format(new Date(year, month, 1), 'MMMM yyyy', { locale: fr });
        
        if (studentReports.length === 0 || !students.some(s => s.trim())) {
            toast({ variant: "destructive", title: "Aucune Donnée", description: "Le registre de présence est vide pour ce mois ou aucun étudiant n'est inscrit." });
            return;
        }
        
        let csvContent = "data:text/csv;charset=utf-8,";
        const monthShort = format(new Date(year, month, 1), 'MMMM', { locale: fr });
        csvContent += `Rapport d'Absences - ${monthShort} ${year}\n`;
        csvContent += `Institut:,"${establishmentName || 'N/A'}"\n`;
        csvContent += `Département:,"${departmentName || 'N/A'}"\n`;
        csvContent += `Niveau:,"${studyLevel ? `${studyLevel} - ${studySubLevel}`: 'N/A'}"\n`;
        csvContent += `Enseignant(s):,"${teacherNames.filter(n => n.trim()).join(', ') || 'N/A'}"\n`;
        csvContent += `Matière:,"${moduleName || 'N/A'}"\n\n`;

        const dayHeaders = recordedDays.map(day => {
            const d = format(day, 'd');
            const m = format(day, 'MMM', { locale: fr });
            return `${d}-${m}`;
        });
        const headers = ["N°", "Nom et Prénom", ...dayHeaders, "Total Absences"];
        csvContent += headers.join(',') + '\n';

        studentReports.forEach(({ name, dailyStatuses, absenceCount }, idx) => {
            const rowData = recordedDays.map(day => `"${dailyStatuses[day.getDate()] || 'P'}"`);
            const row = [
                String(idx + 1),
                `"${name}"`,
                ...rowData,
                absenceCount
            ];
            csvContent += row.join(',') + '\n';
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `rapport_absences_${year}_${String(month + 1).padStart(2, '0')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Succès", description: `Rapport CSV pour ${monthName} exporté.` });
    };

    const handleExportPDF = (concise: boolean) => {
        if (!selectedDate) {
            toast({ variant: "destructive", title: "Aucune Date", description: "Veuillez sélectionner une date." });
            return;
        }
        const { studentReports, recordedDays, month, year } = getMonthlyReportData(getMonth(selectedDate), getYear(selectedDate), concise);
        const monthName = format(new Date(year, month, 1), 'MMMM yyyy', { locale: fr });
        const monthShort = format(new Date(year, month, 1), 'MMMM', { locale: fr });

        if (studentReports.length === 0 || !students.some(s => s.trim())) {
            toast({ variant: "destructive", title: "Aucune Donnée", description: "Le registre de présence est vide pour ce mois ou aucun étudiant n'est inscrit." });
            return;
        }
        if (concise && recordedDays.length === 0) {
            toast({ variant: "destructive", title: "Aucune Donnée", description: "Aucune absence, retard ou excuse enregistrée pour ce mois. Le rapport concis est vide." });
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageMargin = 14;
        let yPos = 12;
        const lineHeight = 6;
        const midX = pageWidth / 2;

        // ═══ 1. Header: two-column institution info ═══
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        const leftLabels = ['Institut:', 'Département:', 'Niveau:', 'Enseignant(s):', 'Matière:'];
        const leftValues = [
            establishmentName || 'N/A',
            departmentName || 'N/A',
            studyLevel ? `${studyLevel} - ${studySubLevel}` : 'N/A',
            teacherNames.filter(n => n.trim()).join(', ') || 'N/A',
            moduleName || 'N/A',
        ];

        leftLabels.forEach((label, i) => {
            // Label (bold)
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(label, pageMargin, yPos + i * lineHeight);
            // Value (normal)
            doc.setFont('helvetica', 'normal');
            doc.text(leftValues[i], pageMargin + 32, yPos + i * lineHeight);
        });

        // Right side: University logo (if available)
        if (universityLogo) {
            try {
                const img = new window.Image();
                img.src = universityLogo;
                const imageTypeMatch = universityLogo.match(/^data:image\/(png|jpe?g|svg\+xml);base64,/);
                let imageType = 'PNG';
                if (imageTypeMatch && imageTypeMatch[1]) {
                    if (imageTypeMatch[1] === 'jpeg' || imageTypeMatch[1] === 'jpg') imageType = 'JPEG';
                    else if (imageTypeMatch[1] === 'svg+xml') imageType = 'SVG';
                    else imageType = imageTypeMatch[1].toUpperCase();
                }
                const logoWidth = 22;
                const logoHeight = (img.height * logoWidth) / img.width;
                doc.addImage(universityLogo, imageType, pageWidth - pageMargin - logoWidth, yPos, logoWidth, logoHeight);
            } catch (e) {
                console.error("Error adding logo to PDF:", e);
            }
        }

        yPos += leftLabels.length * lineHeight + 4;

        // ═══ 2. Title bar ═══
        doc.setFillColor(220, 220, 220);
        doc.rect(pageMargin, yPos - 4, pageWidth - pageMargin * 2, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Rapport d'Absences - ${monthShort} ${year}`, midX, yPos + 2, { align: 'center' });
        yPos += 12;

        // ═══ 3. Table ═══
        // Date headers: "03-mars" format
        const dayHeaders = recordedDays.map(day => {
            const d = format(day, 'd');
            const m = format(day, 'MMM', { locale: fr });
            return `${d}-${m}`;
        });

        const headerRow = [['N°', 'Nom et Prénom', ...dayHeaders, 'Total Absences']];
        const lastColIdx = dayHeaders.length + 2; // N° + Name + dates + Total

        const bodyRows = studentReports.map(({ name, dailyStatuses, absenceCount }, idx) => {
            const rowData = recordedDays.map(day => dailyStatuses[day.getDate()] || 'P');
            return [String(idx + 1), name, ...rowData, String(absenceCount)];
        });

        autoTable(doc, {
            head: headerRow,
            body: bodyRows,
            startY: yPos,
            theme: 'grid',
            styles: {
                fontSize: 7,
                cellPadding: 1.5,
                halign: 'center' as const,
                valign: 'middle' as const,
                lineWidth: 0.2,
                lineColor: [180, 180, 180] as [number, number, number],
            },
            headStyles: {
                fillColor: [50, 50, 50] as [number, number, number],
                textColor: 255,
                fontStyle: 'bold' as const,
                halign: 'center' as const,
                fontSize: 7,
            },
            columnStyles: {
                0: { halign: 'center' as const, fontStyle: 'bold' as const, cellWidth: 10 },
                1: { halign: 'left' as const, fontStyle: 'bold' as const, minCellWidth: 45 },
                [lastColIdx]: { fontStyle: 'bold' as const, halign: 'center' as const, cellWidth: 22 },
            },
            didParseCell: (data) => {
                // Color-code attendance cells in body
                if (data.section === 'body' && data.column.index > 1 && data.column.index < lastColIdx) {
                    const cellText = String(data.cell.raw);
                    if (cellText === 'A') {
                        data.cell.styles.fillColor = [255, 205, 210] as [number, number, number];
                        data.cell.styles.textColor = [183, 28, 28] as [number, number, number];
                        data.cell.styles.fontStyle = 'bold' as const;
                    } else if (cellText === 'R') {
                        data.cell.styles.fillColor = [255, 236, 179] as [number, number, number];
                        data.cell.styles.textColor = [230, 81, 0] as [number, number, number];
                        data.cell.styles.fontStyle = 'bold' as const;
                    } else if (cellText === 'E') {
                        data.cell.styles.fillColor = [187, 222, 251] as [number, number, number];
                        data.cell.styles.textColor = [13, 71, 161] as [number, number, number];
                        data.cell.styles.fontStyle = 'bold' as const;
                    } else {
                        // P = present — light green tint
                        data.cell.styles.fillColor = [232, 245, 233] as [number, number, number];
                        data.cell.styles.textColor = [27, 94, 32] as [number, number, number];
                    }
                }
                // Alternating row background (subtle)
                if (data.section === 'body' && data.row.index % 2 === 1) {
                    const currentFill = data.cell.styles.fillColor;
                    // Only apply if no special color was set above
                    if (!currentFill || (Array.isArray(currentFill) && currentFill[0] === 255 && currentFill[1] === 255)) {
                        data.cell.styles.fillColor = [245, 245, 245] as [number, number, number];
                    }
                }
            },
        });

        // ═══ 4. Legend ═══
        const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text("Légende: P = Présent, A = Absent, R = Retard, E = Excusé", pageMargin, finalY + 8);

        doc.save(`rapport_absences_${year}_${String(month + 1).padStart(2, '0')}${concise ? '_concis' : ''}.pdf`);
        toast({ title: "Succès", description: `Rapport PDF pour ${monthName} exporté.` });
    };

    // ── Email helpers ──────────────────────────────────────────────────

    const generateReportText = (concise: boolean): string => {
        if (!selectedDate) return "";
        const { studentReports, recordedDays, month, year } = getMonthlyReportData(getMonth(selectedDate), getYear(selectedDate), concise);
        const monthName = format(new Date(year, month, 1), 'MMMM yyyy', { locale: fr });
        const monthShort = format(new Date(year, month, 1), 'MMMM', { locale: fr });

        // Date headers in "dd-mmm" format
        const dayHeaders = recordedDays.map(day => {
            const d = format(day, 'd');
            const m = format(day, 'MMM', { locale: fr });
            return `${d}-${m}`;
        });

        let text = `RAPPORT D'ABSENCES - ${monthShort.toUpperCase()} ${year}\n`;
        text += `${'═'.repeat(60)}\n\n`;
        text += `Institut :       ${establishmentName || 'N/A'}\n`;
        text += `Département :    ${departmentName || 'N/A'}\n`;
        text += `Niveau :         ${studyLevel ? `${studyLevel} - ${studySubLevel}` : 'N/A'}\n`;
        text += `Enseignant(s) :  ${teacherNames.filter(n => n.trim()).join(', ') || 'N/A'}\n`;
        text += `Matière :        ${moduleName || 'N/A'}\n\n`;

        // Table header
        const colWidth = 12;
        const nameWidth = 25;
        const numWidth = 4;
        let header = `${'N°'.padEnd(numWidth)} ${'Nom et Prénom'.padEnd(nameWidth)}`;
        dayHeaders.forEach(h => { header += ` ${h.padEnd(colWidth)}`; });
        header += ` ${'Total'.padEnd(6)}`;

        text += header + '\n';
        text += '-'.repeat(header.length) + '\n';

        // Table rows
        studentReports.forEach(({ name, dailyStatuses, absenceCount }, idx) => {
            let row = `${String(idx + 1).padEnd(numWidth)} ${name.padEnd(nameWidth)}`;
            recordedDays.forEach(day => {
                const symbol = dailyStatuses[day.getDate()] || 'P';
                row += ` ${symbol.padEnd(colWidth)}`;
            });
            row += ` ${String(absenceCount).padEnd(6)}`;
            text += row + '\n';
        });

        text += '\n' + '═'.repeat(60) + '\n';
        text += `Légende: P = Présent, A = Absent, R = Retard, E = Excusé\n`;
        text += `Rapport généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}\n`;
        text += `GradeAssist - Application d'évaluation académique`;

        return text;
    };

    const sendReportByEmail = (concise: boolean) => {
        if (!selectedDate) {
            toast({ variant: "destructive", title: "Aucune Date", description: "Veuillez sélectionner une date." });
            return;
        }
        if (!adminEmail) {
            toast({ variant: "destructive", title: "Email manquant", description: "Veuillez renseigner l'adresse email de l'administration dans les Informations Générales." });
            return;
        }

        const { studentReports, recordedDays, month, year } = getMonthlyReportData(getMonth(selectedDate), getYear(selectedDate), concise);
        const monthName = format(new Date(year, month, 1), 'MMMM yyyy', { locale: fr });

        if (studentReports.length === 0 || !students.some(s => s.trim())) {
            toast({ variant: "destructive", title: "Aucune Donnée", description: "Le registre de présence est vide pour ce mois." });
            return;
        }
        if (concise && recordedDays.length === 0) {
            toast({ variant: "destructive", title: "Aucune Donnée", description: "Aucune absence enregistrée pour ce mois." });
            return;
        }

        const reportText = generateReportText(concise);
        const subject = `Rapport d'absences - ${moduleName || 'Matière'} - ${monthName}`;

        const mailtoUrl = `mailto:${encodeURIComponent(adminEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportText)}`;
        window.open(mailtoUrl, "_blank");

        toast({
            title: "Email préparé",
            description: `Le client email s'ouvre avec le rapport. Joignez le fichier PDF exporté si besoin.`,
        });
    };

    return (
        <>
            <div className="flex justify-center">
                <Button 
                    variant="outline" 
                    onClick={() => setShowRegistry(!showRegistry)}
                    className="border-dashed border-accent/40 text-accent hover:bg-accent/5 hover:border-accent/60"
                >
                    <UserCheck className="mr-2 h-4 w-4" />
                    {showRegistry ? "Masquer" : "Registre de Présence"}
                </Button>
            </div>
            {showRegistry && (
                <Card className="card-premium overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-emerald-500 via-accent to-emerald-500" />
                    <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-transparent">
                        <CardTitle className="text-lg flex items-center gap-2"><UserCheck className="h-5 w-5 text-emerald-600" />Registre de Présence</CardTitle>
                        <CardDescription>
                            Sélectionnez une date pour enregistrer les présences. Les rapports couvrent le mois complet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 flex flex-col items-center">
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-[280px] justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    initialFocus
                                    locale={fr}
                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                        
                        <div className="md:col-span-2 overflow-x-auto border rounded-lg max-h-96">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[200px]">Étudiant</TableHead>
                                        <TableHead className="text-center">Statut</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map(studentName => {
                                        if (!studentName) return null;
                                        const currentStatus = (selectedDateKey && attendance[selectedDateKey]?.[studentName]) || 'present';
                                        return (
                                        <TableRow key={studentName}>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{getInitials(studentName)}</AvatarFallback>
                                                    </Avatar>
                                                    {studentName}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center p-1">
                                                <Select value={currentStatus} onValueChange={(value: AttendanceStatus) => handleStatusChange(studentName, value)}>
                                                    <SelectTrigger className="w-32 h-9 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {statusOptions.map(option => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                <div className="flex items-center gap-2">
                                                                    <option.icon className={cn("h-4 w-4", option.colorClass)} />
                                                                    <span>{option.label}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pt-6 border-t">
                         {/* ── Admin email + Send section ── */}
                         <div className="w-full space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Mail className="h-4 w-4 text-primary" />
                                Envoi du rapport mensuel à l&apos;administration
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        type="email"
                                        value={adminEmail}
                                        onChange={(e) => setAdminEmail?.(e.target.value)}
                                        placeholder="Email administration (ex: dep-info@univ.dz)"
                                        className="w-full h-9 pl-9 pr-3 rounded-lg border border-border/60 bg-background text-sm focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                    />
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => sendReportByEmail(true)}
                                        disabled={!adminEmail}
                                        className="bg-primary hover:bg-primary/90"
                                        size="sm"
                                    >
                                        <Send className="mr-2 h-3.5 w-3.5" />
                                        Envoyer Rapport Concis
                                    </Button>
                                    <Button
                                        onClick={() => sendReportByEmail(false)}
                                        disabled={!adminEmail}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Send className="mr-2 h-3.5 w-3.5" />
                                        Envoyer Rapport Complet
                                    </Button>
                                </div>
                            </div>
                            {!adminEmail && (
                                <p className="text-[11px] text-muted-foreground">
                                    Renseignez l&apos;email de l&apos;administration pour envoyer les rapports mensuels directement depuis l&apos;application.
                                </p>
                            )}
                         </div>

                         {/* ── Export buttons ── */}
                         <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-border/40">
                            <div className="text-sm text-muted-foreground">
                                Légende: P=Présent, A=Absent, R=Retard, E=Excusé
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                                <Button onClick={handleExportCSV} variant="outline" size="sm">
                                    <Download className="mr-2 h-3.5 w-3.5" />
                                    CSV
                                </Button>
                                <Button onClick={() => handleExportPDF(false)} variant="outline" size="sm">
                                    <Download className="mr-2 h-3.5 w-3.5" />
                                    PDF Complet
                                </Button>
                                <Button onClick={() => handleExportPDF(true)} size="sm">
                                    <FileBarChart className="mr-2 h-3.5 w-3.5" />
                                    PDF Concis
                                </Button>
                            </div>
                         </div>
                    </CardFooter>
                </Card>
            )}
        </>
    );
}
