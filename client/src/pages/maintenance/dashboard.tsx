import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, FileJson, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function MaintenanceDashboard() {
  const { user, faults, lines, resolveFault, subsidiaries, updateFaultFeedback } = useApp();
  const { toast } = useToast();

  const [completingFaultId, setCompletingFaultId] = useState<string | null>(null);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const myTasks = faults.filter(f => f.assignedTo === user?.id && f.status === 'assigned');
  const completedTasks = faults.filter(f => f.assignedTo === user?.id && f.status === 'resolved');

  const handleComplete = () => {
    if (completingFaultId) {
      resolveFault(completingFaultId, feedback || "Issue resolved successfully.");
      toast({
        title: "Tâche terminée",
        description: "Commentaires transmis à l'administration.",
        className: "bg-success text-success-foreground border-none"
      });
      setCompletingFaultId(null);
      setFeedback("");
    }
  };

  const handleUpdateFeedback = () => {
    if (editingFeedbackId && feedback) {
      updateFaultFeedback(editingFeedbackId, feedback);
      toast({
        title: "Updated",
        description: "Feedback updated successfully."
      });
      setEditingFeedbackId(null);
      setFeedback("");
    }
  };

  const startEditFeedback = (fault: any) => {
    setEditingFeedbackId(fault.id);
    setFeedback(fault.feedback || "");
  };

  const getLineDetails = (lineId: string) => lines.find(l => l.id === lineId);
  const getSubName = (subId: string) => subsidiaries.find(s => s.id === subId)?.name;

  const exportToPDF = () => {
    if (myTasks.length === 0) {
      toast({ title: "Aucune Donnée", description: "Aucun ordre de travail à exporter.", variant: "destructive" });
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Rapport sur les bons de travail", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generé: ${format(new Date(), "PPP p")}`, 14, 22);
    doc.text(`Technicien(e): ${user?.name}`, 14, 28);

    const tableData = myTasks.map((fault) => {
      const line = getLineDetails(fault.lineId);
      return [
        fault.id.substring(0, 8),
        format(new Date(fault.assignedAt || ''), "PP"),
        getSubName(fault.subsidiaryId) || '',
        line?.number || '',
        line?.location || '',
        fault.symptoms,
        fault.probableCause
      ];
    });

    autoTable(doc, {
      head: [['ID', 'Assignée', 'Fillial', 'Ligne', 'Localisation', 'Symptômes', 'Cause Propable']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' }
    });

    doc.save(`work-orders-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: "Exportée", description: "Les ordres de travail ont été exportés avec succès au format PDF." });
  };

  const exportToExcel = () => {
    if (myTasks.length === 0) {
      toast({ title: "Aucune Donnée", description: "Aucun ordre de travail à exporter.", variant: "destructive" });
      return;
    }

    const data = myTasks.map((fault) => {
      const line = getLineDetails(fault.lineId);
      return {
        'ID': fault.id,
        'Date assigieument': fault.assignedAt ? format(new Date(fault.assignedAt), "PPP p") : '-',
        'fillial': getSubName(fault.subsidiaryId) || '',
        'Numémro ligne': line?.number || '',
        'Type de ligne': line?.type || '',
        'Localisation': line?.location || '',
        'Symptôms': fault.symptoms,
        'Cause Propable': fault.probableCause,
        'Statu': fault.status
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Work Orders");

    worksheet['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 12 },
      { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 10 }
    ];

    XLSX.writeFile(workbook, `work-orders-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast({ title: "Exportée", description: "Les ordres de travail ont été exportés avec succès vers Excel." });
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portail de maintenance</h1>
        <p className="text-muted-foreground">Bons de travail attribués à {user?.name}</p>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              travail actifs
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={exportToPDF}
              >
                <FileText className="h-4 w-4 mr-1" />
                Exporté en PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={exportToExcel}
              >
                <FileJson className="h-4 w-4 mr-1" />
                exporté en Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attribué à</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Info Ligne</TableHead>
                <TableHead>Problème signalé</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun Bon de travail en cours. Excellent travail !
                  </TableCell>
                </TableRow>
              ) : (
                myTasks.map((fault) => {
                  const line = getLineDetails(fault.lineId);
                  return (
                    <TableRow key={fault.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {fault.assignedAt ? format(new Date(fault.assignedAt), "PP p") : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{getSubName(fault.subsidiaryId)}</div>
                        <div className="text-xs text-muted-foreground">{line?.location}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {line?.number} ({line?.type})
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <div className="font-medium">{fault.symptoms}</div>
                        <div className="text-xs text-muted-foreground">Cause: {fault.probableCause}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => setCompletingFaultId(fault.id)}>
                          Travail Terminer
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Tâches Terminées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Resolved</TableHead>
                <TableHead>Line</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No completed tasks yet.
                  </TableCell>
                </TableRow>
              ) : (
                completedTasks.map((fault) => {
                  const line = getLineDetails(fault.lineId);
                  return (
                    <TableRow key={fault.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {fault.resolvedAt ? format(new Date(fault.resolvedAt), "PP p") : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {line?.number}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate">
                        {fault.feedback}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => startEditFeedback(fault)}>
                          Edit Feedback
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


      <Dialog open={!!completingFaultId} onOpenChange={(open) => !open && setCompletingFaultId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminer le bon de travail</DialogTitle>
            <DialogDescription>Veuillez fournir un retour d'information sur la réparation pour clore ce ticket.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Describe the repair actions taken..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleComplete}>Submit Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingFeedbackId} onOpenChange={(open) => !open && setEditingFeedbackId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Feedback</DialogTitle>
            <DialogDescription>Update your repair notes.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Describe the repair actions taken..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateFeedback}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
