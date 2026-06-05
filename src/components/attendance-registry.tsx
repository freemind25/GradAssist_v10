
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
import { CheckCircle2, XCircle, Clock, FileText, UserCheck, Download, Calendar as CalendarIcon, FileBarChart } from "lucide-react";
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
    moduleName
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
        csvContent += `Rapport d'Absences - ${monthName}\n`;
        csvContent += `Institut:,"${establishmentName || 'N/A'}"\n`;
        csvContent += `Département:,"${departmentName || 'N/A'}"\n`;
        csvContent += `Niveau:,"${studyLevel ? `${studyLevel} - ${studySubLevel}`: 'N/A'}"\n`;
        csvContent += `Enseignant(s):,"${teacherNames.join(', ') || 'N/A'}"\n`;
        csvContent += `Matière:,"${moduleName || 'N/A'}"\n\n`;

        const dayHeaders = recordedDays.map(day => format(day, 'd'));
        const headers = ["Nom et Prénom", ...dayHeaders, "Total Absences"];
        csvContent += headers.join(',') + '\n';

        studentReports.forEach(({ name, dailyStatuses, absenceCount }) => {
            const rowData = recordedDays.map(day => `"${dailyStatuses[day.getDate()] || 'P'}"`);
            const row = [
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
        
        if (studentReports.length === 0 || !students.some(s => s.trim())) {
            toast({ variant: "destructive", title: "Aucune Donnée", description: "Le registre de présence est vide pour ce mois ou aucun étudiant n'est inscrit." });
            return;
        }
        if (concise && recordedDays.length === 0) {
            toast({ variant: "destructive", title: "Aucune Donnée", description: "Aucune absence, retard ou excuse enregistrée pour ce mois. Le rapport concis est vide." });
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });
        const pageMargin = 14;
        let yPos = 15;

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

                const logoWidth = 25;
                const logoHeight = (img.height * logoWidth) / img.width;
                doc.addImage(universityLogo, imageType, doc.internal.pageSize.getWidth() - pageMargin - logoWidth, yPos, logoWidth, logoHeight);
             } catch (e) {
                console.error("Error adding logo to PDF:", e);
             }
        }

        doc.setFillColor(230, 230, 230);
        doc.rect(pageMargin, yPos - 5, doc.internal.pageSize.getWidth() - (pageMargin * 2), 12, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`Rapport d'Absences - ${monthName}`, doc.internal.pageSize.getWidth() / 2, yPos + 2, { align: 'center' });
        yPos += 15;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const infoCol1 = `Institut: ${establishmentName || 'N/A'}\nDépartement: ${departmentName || 'N/A'}\nNiveau: ${studyLevel ? `${studyLevel} - ${studySubLevel}`: 'N/A'}`;
        const infoCol2 = `Enseignant(s): ${teacherNames.join(', ') || 'N/A'}\nMatière: ${moduleName || 'N/A'}`;
        doc.text(infoCol1, pageMargin, yPos);
        doc.text(infoCol2, doc.internal.pageSize.getWidth() / 2, yPos);
        yPos += 20;
        
        const dayHeaders = recordedDays.map(day => format(day, 'd'));
        const monthHeader = [{ content: format(new Date(year, month, 1), 'MMMM', { locale: fr }), colSpan: dayHeaders.length, styles: { halign: 'center', fillColor: [240, 240, 240], textColor: 0 } }];
        
        const head = [
            [
                { content: 'Nom et Prénom', rowSpan: 2, styles: { valign: 'middle', fillColor: [220,220,220] } },
                ...monthHeader,
                { content: 'Total Absences', rowSpan: 2, styles: { valign: 'middle', fillColor: [255,210,210] } }
            ],
            dayHeaders
        ];
        
        const body = studentReports.map(({ name, dailyStatuses, absenceCount }) => {
            const rowData = recordedDays.map(day => dailyStatuses[day.getDate()] || 'P');
            return [ name, ...rowData, absenceCount ];
        });

        autoTable(doc, {
            head: head,
            body: body,
            startY: yPos,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 1, halign: 'center', valign: 'middle' },
            headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' },
            columnStyles: {
                0: { halign: 'left', fontStyle: 'bold', minCellWidth: 40 },
                [head[1].length]: { fontStyle: 'bold', halign: 'center', textColor: [200, 0, 0] },
            },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index > 0 && data.column.index <= dayHeaders.length) {
                    const cellText = String(data.cell.raw);
                    if (cellText === 'A') {
                       data.cell.styles.fillColor = '#ffcdd2';
                       data.cell.styles.textColor = '#b71c1c';
                    }
                    if (cellText === 'R') {
                       data.cell.styles.fillColor = '#ffecb3';
                       data.cell.styles.textColor = '#e65100';
                    }
                     if (cellText === 'E') {
                       data.cell.styles.fillColor = '#bbdefb';
                       data.cell.styles.textColor = '#0d47a1';
                    }
                }
            }
        });
        
        const finalY = (doc as any).lastAutoTable.finalY || yPos;
        const legendY = finalY + 10;
        doc.setFontSize(8);
        doc.text("Légende: P=Présent, A=Absent, R=Retard, E=Excusé", pageMargin, legendY);


        doc.save(`rapport_absences_${year}_${String(month + 1).padStart(2, '0')}${concise ? '_concis' : ''}.pdf`);
        toast({ title: "Succès", description: `Rapport PDF pour ${monthName} exporté.` });
    };

    return (
        <>
            <div className="flex justify-center">
                <Button 
                    variant="outline" 
                    onClick={() => setShowRegistry(!showRegistry)}
                    disabled={false}
                >
                    <UserCheck className="mr-2 h-4 w-4" />
                    {showRegistry ? "Cacher" : "Afficher"} le Registre de Présence
                </Button>
            </div>
            {showRegistry && (
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2"><UserCheck />Registre de Présence</CardTitle>
                        <CardDescription>
                            Sélectionnez une date pour enregistrer les présences. Les rapports sont générés pour le mois entier de la date sélectionnée.
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
                    <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
                         <div className="text-sm text-muted-foreground">
                            Légende: P=Présent, A=Absent, R=Retard, E=Excusé
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button onClick={handleExportCSV} variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Rapport Complet (CSV)
                            </Button>
                            <Button onClick={() => handleExportPDF(false)} variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Rapport Complet (PDF)
                            </Button>
                             <Button onClick={() => handleExportPDF(true)}>
                                <FileBarChart className="mr-2 h-4 w-4" />
                                Rapport Concis (PDF)
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}
        </>
    );
}
