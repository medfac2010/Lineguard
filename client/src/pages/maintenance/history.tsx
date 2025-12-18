import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Download, FileJson, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function MaintenanceHistory() {
  const { user, faults, lines, subsidiaries } = useApp();
  const { toast } = useToast();

  const [isExportHistoryOpen, setIsExportHistoryOpen] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");

  const completedTasks = faults.filter(f => f.assignedTo === user?.id && f.status === 'resolved');

  const getLineDetails = (lineId: string) => lines.find(l => l.id === lineId);
  const getSubName = (subId: string) => subsidiaries.find(s => s.id === subId)?.name;

  const exportHistoryToPDF = () => {
    if (!historyStartDate || !historyEndDate) {
      toast({ title: "Erreur", description: "Veuillez sélectionner les dates de début et de fin.", variant: "destructive" });
      return;
    }

    const startDate = new Date(historyStartDate);
    const endDate = new Date(historyEndDate);
    endDate.setHours(23, 59, 59);

    const filteredHistory = completedTasks.filter(fault => {
      const resolvedDate = fault.resolvedAt ? new Date(fault.resolvedAt) : null;
      return resolvedDate && resolvedDate >= startDate && resolvedDate <= endDate;
    });

    if (filteredHistory.length === 0) {
      toast({ title: "Aucune donnée", description: "Aucune intervention n'a été trouvée dans cette plage de dates.", variant: "destructive" });
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Rapport sur l'historique des interventions", 14, 15);
    doc.setFontSize(10);
    doc.text(`Généré : ${format(new Date(), "PPP p")}`, 14, 22);
    doc.text(`Technicien(e): ${user?.name}`, 14, 28);
    doc.text(`Période: ${format(startDate, "PP")} to ${format(endDate, "PP")}`, 14, 34);

    const tableData = filteredHistory.map((fault) => {
      const line = getLineDetails(fault.lineId);
      return [
        fault.id.substring(0, 8),
        format(new Date(fault.resolvedAt || ''), "PP"),
        getSubName(fault.subsidiaryId) || '',
        line?.number || '',
        fault.symptoms,
        fault.feedback || '-'
      ];
    });

    autoTable(doc, {
      head: [['ID', 'Date de résolution', 'Filiale', 'Ligne', 'Problème', 'Infro Retournée']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' }
    });

    doc.save(`intervention-history-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.pdf`);
    toast({ title: "Exportée", description: "Historique des interventions exporté avec succès au format PDF." });
    setIsExportHistoryOpen(false);
    setHistoryStartDate("");
    setHistoryEndDate("");
  };

  const exportHistoryToExcel = () => {
    if (!historyStartDate || !historyEndDate) {
      toast({ title: "Erreur", description: "Veuillez sélectionner les dates de début et de fin.", variant: "destructive" });
      return;
    }

    const startDate = new Date(historyStartDate);
    const endDate = new Date(historyEndDate);
    endDate.setHours(23, 59, 59);

    const filteredHistory = completedTasks.filter(fault => {
      const resolvedDate = fault.resolvedAt ? new Date(fault.resolvedAt) : null;
      return resolvedDate && resolvedDate >= startDate && resolvedDate <= endDate;
    });

    if (filteredHistory.length === 0) {
      toast({ title: "Aucune donnée", description: "Aucune intervention n'a été trouvée dans cette plage de dates.", variant: "destructive" });
      return;
    }

    const data = filteredHistory.map((fault) => {
      const line = getLineDetails(fault.lineId);
      return {
        'ID': fault.id,
        'Resolved Date': fault.resolvedAt ? format(new Date(fault.resolvedAt), "PPP p") : '-',
        'Subsidiary': getSubName(fault.subsidiaryId) || '',
        'Line Number': line?.number || '',
        'Line Type': line?.type || '',
        'Symptoms': fault.symptoms,
        'Probable Cause': fault.probableCause,
        'Feedback': fault.feedback || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historique des interventions");
    
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 12 },
      { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 25 }
    ];

    XLSX.writeFile(workbook, `intervention-history-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.xlsx`);
    toast({ title: "Exportée", description: "L'historique des interventions a été exporté avec succès vers Excel." });
    setIsExportHistoryOpen(false);
    setHistoryStartDate("");
    setHistoryEndDate("");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historique des interventions</h1>
          <p className="text-muted-foreground">Consulter et exporter les interventions terminées</p>
        </div>
        <Dialog open={isExportHistoryOpen} onOpenChange={setIsExportHistoryOpen}>
          <Button onClick={() => setIsExportHistoryOpen(true)}>
            <Download className="h-4 w-4 mr-1" />
            Historique des exportations
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Historique des interventions à l'exportation</DialogTitle>
              <DialogDescription>Sélectionnez la plage de dates à exporter</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Date de début</Label>
                <Input 
                  id="start-date"
                  type="date"
                  value={historyStartDate}
                  onChange={(e) => setHistoryStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Date de fin</Label>
                <Input 
                  id="end-date"
                  type="date"
                  value={historyEndDate}
                  onChange={(e) => setHistoryEndDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setIsExportHistoryOpen(false)}
              >
                Annuler
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={exportHistoryToPDF}
              >
                <FileText className="h-4 w-4 mr-1" />
                Exporter on PDF
              </Button>
              <Button 
                size="sm"
                onClick={exportHistoryToExcel}
              >
                <FileJson className="h-4 w-4 mr-1" />
                Exporter on Excel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interventions terminées</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date de résolution</TableHead>
                <TableHead>Fillial</TableHead>
                <TableHead>Ligne</TableHead>
                <TableHead>Probléme</TableHead>
                <TableHead>Commentaires fournis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                     Aucune intervention n'a encore été réalisée.
                  </TableCell>
                </TableRow>
              ) : (
                completedTasks.map((fault) => {
                  const line = getLineDetails(fault.lineId);
                  return (
                    <TableRow key={fault.id}>
                      <TableCell className="text-sm">
                        {fault.resolvedAt ? format(new Date(fault.resolvedAt), "PP p") : '-'}
                      </TableCell>
                      <TableCell className="text-sm">{getSubName(fault.subsidiaryId)}</TableCell>
                      <TableCell className="font-mono text-sm">{line?.number}</TableCell>
                      <TableCell className="max-w-[250px] text-sm">{fault.symptoms}</TableCell>
                      <TableCell className="text-sm italic text-muted-foreground">{fault.feedback}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
