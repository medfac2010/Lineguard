import { useApp } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { exportFaultsPdf, exportFaultsXlsx } from '@/lib/export-faults';
import { CartesianGrid } from 'recharts';
import { Fault } from "@/lib/types";
import  { DocumentIcon, TableCellsIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export default function AdminFaults() {
  const { faults, lines, users, assignFault, subsidiaries } = useApp();
  const { toast } = useToast();
  
  const [selectedFaultId, setSelectedFaultId] = useState<string | null>(null);
  const [selectedMaintUser, setSelectedMaintUser] = useState<string>("");

  // Filters: multi-subsidiary and date range
  const [selectedSubsidiaryIds, setSelectedSubsidiaryIds] = useState<string[]>(subsidiaries.map(s => s.id));
  // default to last 30 days
  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(defaultEnd.getDate() - 30);
  const [startDate, setStartDate] = useState<string>(defaultStart.toISOString().slice(0,10));
  const [endDate, setEndDate] = useState<string>(defaultEnd.toISOString().slice(0,10));

  const activeFaults = faults.filter(f => f.status !== 'resolved');
  const maintenanceUsers = users.filter(u => u.role === 'maintenance');

  const getLineDetails = (lineId: string) => lines.find(l => l.id === lineId);
  const getSubName = (subId: string) => subsidiaries.find(s => s.id === subId)?.name;

  const handleAssign = () => {
    if (selectedFaultId && selectedMaintUser) {
      assignFault(selectedFaultId, selectedMaintUser);
      toast({
        title: "Bon de travail envoyé",
        description: "L'équipe de maintenance a été informée.",
      });
      setSelectedFaultId(null);
      setSelectedMaintUser("");
    }
  };

  // compute filtered faults using selected subsidiaries and date range
  const filteredFaults = activeFaults.filter(f => {
    if (!selectedSubsidiaryIds.includes(f.subsidiaryId)) return false;
    if (startDate) {
      const start = new Date(startDate);
      if (new Date(f.declaredAt) < start) return false;
    }
    if (endDate) {
      // include entire end day
      const end = new Date(endDate);
      end.setHours(23,59,59,999);
      if (new Date(f.declaredAt) > end) return false;
    }
    return true;
  });
 const exporttoPDFbySubsidiary = () => {
                if (filteredFaults.length === 0) { toast({ title: "Aucune donnée", description: "Aucune panne active à exporter.", variant: "destructive" }); return; }
                exportFaultsPdf(filteredFaults, lines, subsidiaries, users, 'pannes_par_filiale.pdf');
                toast({ title: "PDF exporté", description: "PDF groupé par filiale téléchargé." });
              }
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Rapports de pannes actives", 14, 22);
    doc.setFontSize(11);
    doc.text(`Généré le ${format(new Date(), "PPpp")}`, 14, 30);

    const tableData = filteredFaults.map(fault => {
      const line = getLineDetails(fault.lineId);
      return [
        format(new Date(fault.declaredAt), "yyyy-MM-dd HH:mm"),
        getSubName(fault.subsidiaryId) || 'Unknown',
        line?.number || 'Unknown',
        fault.symptoms,
        fault.probableCause,
        fault.status.toUpperCase()
      ];
    });

    autoTable(doc, {
      head: [['Date', 'Filiale', 'Ligne', 'Symptômes', 'Cause Probable', 'Statut']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 135, 245] }
    });

    doc.save('active_faults_report.pdf');
    toast({ title: "PDF exporté", description: "Le fichier a été téléchargé." });
  };
  const exportToExcelBySubsidiary = () => {
                if (filteredFaults.length === 0) { toast({ title: "Aucune donnée", description: "Aucune panne active à exporter.", variant: "destructive" }); return; }
                exportFaultsXlsx(filteredFaults, lines, subsidiaries, users, 'pannes_par_filiale.xlsx');
                toast({ title: "Excel exporté", description: "Excel groupé par filiale téléchargé." });
              }
  const exportToExcel = () => {
    const data = filteredFaults.map(fault => {
      const line = getLineDetails(fault.lineId);
      return {
        "Date Reported": format(new Date(fault.declaredAt), "yyyy-MM-dd HH:mm:ss"),
        "Subsidiary": getSubName(fault.subsidiaryId),
        "Line Number": line?.number,
        "Line Type": line?.type,
        "Symptoms": fault.symptoms,
        "Probable Cause": fault.probableCause,
        "Status": fault.status,
        "Assigned To": fault.assignedTo ? users.find(u => u.id === fault.assignedTo)?.name : 'Unassigned'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Défauts actifs");
    XLSX.writeFile(wb, "rapport_de_défauts_actifs.xlsx");
    toast({ title: "Excel exporté", description: "Le fichier a été téléchargé." });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des pannes</h1>
          <p className="text-muted-foreground">Vérifier les problèmes et assigner les bons de travail</p>
        </div>
      </div>
      <div className="rounded-xl border bg-card text-card-foreground shadow">            
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
              <CardDescription>Sélectionnez le filtrer des pannes</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="w-full md:w-56">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>Filiales</span>
                      <span className="text-sm text-muted-foreground">({selectedSubsidiaryIds.length})</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
                        <Button size="sm" onClick={() => setSelectedSubsidiaryIds(subsidiaries.map(s => s.id))}>Tout sélectionner</Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedSubsidiaryIds([])}>Effacer</Button>
                      </div>
                      <div className="grid max-h-48 overflow-auto">
                        {subsidiaries.map(sub => (
                          <div key={sub.id} className="flex items-center gap-2 py-1" onPointerDown={(e) => e.stopPropagation()}>
                            <Checkbox checked={selectedSubsidiaryIds.includes(sub.id)} onCheckedChange={(val) => {
                              if (val) setSelectedSubsidiaryIds(prev => Array.from(new Set([...prev, sub.id])));
                              else setSelectedSubsidiaryIds(prev => prev.filter(id => id !== sub.id));
                            }} />
                            <div className="text-sm">{sub.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex w-full md:max-w-md gap-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="startDate">Date début</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="endDate">Date fin</Label>
                  <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="w-full md:w-48">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between border-blue-600 text-blue-700 hover:bg-blue-50">
                      <span>Exporter</span>
                      <ChevronDownIcon className="ml-2 h-4 w-4 text-blue-600" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-56 bg-blue-50 text-blue-900 border border-blue-100">
                    <div className="flex flex-col">
                      <Button variant="ghost" className="justify-start text-blue-700 hover:bg-blue-100" onClick={exportToPDF}>Exporter par Filter (PDF)</Button>
                      <Button variant="ghost" className="justify-start text-blue-700 hover:bg-blue-100" onClick={exportToExcel}>Exporter par filter (Excel)</Button>
                      <Button variant="ghost" className="justify-start text-blue-700 hover:bg-blue-100" onClick={exporttoPDFbySubsidiary}>Exporter par filiale (PDF)</Button>
                      <Button variant="ghost" className="justify-start text-blue-700 hover:bg-blue-100" onClick={exportToExcelBySubsidiary}>Exporter par filiale (Excel)</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>      
          </Card>
      </div>
      <Card>
          <CardHeader>
            <CardTitle>Rapports de pannes actives</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Filiale</TableHead>
                  <TableHead>Ligne</TableHead>
                  <TableHead>Problème</TableHead>
                  <TableHead>Cause Probable</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune panne active signalée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFaults.map((fault) => {
                    const line = getLineDetails(fault.lineId);
                    return (
                      <TableRow key={fault.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {format(new Date(fault.declaredAt), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>{getSubName(fault.subsidiaryId)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          <div>{line?.number}</div>
                          <div className="text-muted-foreground">{line?.type}</div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="font-medium truncate" title={fault.symptoms}>{fault.symptoms}</div>
                          <div className="text-xs text-muted-foreground truncate" title={fault.probableCause}>Cause probable: {fault.probableCause}</div>
                        </TableCell>
                        <TableCell>
                          {fault.status === 'open' && <Badge variant="destructive">Ouvert</Badge>}
                          {fault.status === 'assigned' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Assigné</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          {fault.status === 'open' && (
                            <Button size="sm" onClick={() => setSelectedFaultId(fault.id)}>
                              Assign Bon de travail
                            </Button>
                          )}
                          {fault.status === 'assigned' && (
                            <span className="text-xs text-muted-foreground italic">
                              En attente de retour
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
      </Card>
      <Dialog open={!!selectedFaultId} onOpenChange={(open) => !open && setSelectedFaultId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un bon de travail</DialogTitle>
            <DialogDescription>Sélectionner un membre de l'équipe de maintenance pour gérer ce problème.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedMaintUser} onValueChange={setSelectedMaintUser}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une équipe de maintenance" />
              </SelectTrigger>
              <SelectContent>
                {maintenanceUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleAssign} disabled={!selectedMaintUser}>Envoyer le bon de travail</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
