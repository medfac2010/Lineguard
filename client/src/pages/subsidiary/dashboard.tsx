import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { FaultReportDialog } from "@/components/fault-report-dialog";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SubsidiaryDashboard() {
  const { user, lines, confirmWorking, faults, addLine, lineTypes } = useApp();
  const { toast } = useToast();
  const [reportingLineId, setReportingLineId] = useState<string | null>(null);
  const [isAddLineOpen, setIsAddLineOpen] = useState(false);
  const [newLine, setNewLine] = useState({ number: "", type: lineTypes[0]?.code || "", location: "", inFaultFlow: true });

  // Filter lines for this user's subsidiary that are in fault flow
  const myLines = lines.filter(l => l.subsidiaryId === user?.subsidiaryId && l.inFaultFlow !== false);

  // Stats
  const total = myLines.length;
  const working = myLines.filter(l => l.status === 'working').length;
  const faulty = myLines.filter(l => ['faulty', 'maintenance'].includes(l.status)).length;

  const handleConfirmWorking = (id: string) => {
    confirmWorking(id);
    toast({
      title: "Ligne Verifiée",
      description: "Line status updated to Good Working Order.",
      className: "bg-success text-success-foreground border-none"
    });
  };

  // Check if a line has an active fault report declared today (for reminder logic)
  // "Si la ligne est déjà déclarée auparavant, l’utilisateur déclenché un rappel le jour suivant"
  const getActionForLine = (line: any) => {
    if (line.status === 'working') {
      return (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
            onClick={() => handleConfirmWorking(line.id)}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm OK
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => setReportingLineId(line.id)}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Report Fault
          </Button>
        </div>
      );
    }

    if (line.status === 'faulty') {
       // Check if we need to trigger a reminder (if declared before today)
       // For simplicity in mockup, just show "Send Reminder" if faulty
       return (
        <div className="flex gap-2">
           <Button 
            size="sm" 
            variant="secondary"
            className="text-orange-600 bg-orange-50 hover:bg-orange-100"
            onClick={() => toast({ title: "Reminder Sent", description: "Admin notified again." })}
          >
            <Clock className="w-4 h-4 mr-2" />
            Send Reminder
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
            onClick={() => handleConfirmWorking(line.id)}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Restored
          </Button>
        </div>
       );
    }
    
    if (line.status === 'maintenance') {
      return <span className="text-xs font-medium text-muted-foreground italic">En réparation</span>;
    }

    return null;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'working': return <Badge className="bg-success hover:bg-success/90">Opérationnel</Badge>;
      case 'faulty': return <Badge variant="destructive">Panne signalée</Badge>;
      case 'maintenance': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Maintenance</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddLine = async () => {
    if (!newLine.number.trim() || !newLine.location.trim() || !user?.subsidiaryId) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez remplir tous les champs obligatoires.", 
        variant: "destructive" 
      });
      return;
    }
    
    const success = await addLine(newLine.number, newLine.type, user.subsidiaryId, newLine.location, newLine.inFaultFlow);
    
    if (success) {
      toast({ 
        title: "Ligne ajoutée", 
        description: "La nouvelle ligne a été créée avec succès.",
        className: "bg-success text-success-foreground border-none"
      });
    setIsAddLineOpen(false);
      setNewLine({ number: "", type: lineTypes[0]?.code || "", location: "", inFaultFlow: true });
    } else {
      toast({ 
        title: "Erreur", 
        description: "Impossible d'ajouter la ligne. Veuillez réessayer.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">Gérer l'état des lignes pour {user?.name}</p>
        </div>
        <Dialog open={isAddLineOpen} onOpenChange={setIsAddLineOpen}>
          <Button onClick={() => setIsAddLineOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une ligne
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle ligne</DialogTitle>
              <DialogDescription>Créer une nouvelle ligne téléphonique pour votre bureau</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lineNumber">Numéro de ligne / ID</Label>
                <Input 
                  id="lineNumber"
                  value={newLine.number}
                  onChange={(e) => setNewLine({...newLine, number: e.target.value})}
                  placeholder="Ex: LS-1234 ou 1001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lineType">Type de ligne</Label>
                <Select value={newLine.type} onValueChange={(val: any) => setNewLine({...newLine, type: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lineTypes.map(lt => (
                      <SelectItem key={lt.id} value={lt.code}>{lt.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localisation du bureau</Label>
                <Input 
                  id="location"
                  value={newLine.location}
                  onChange={(e) => setNewLine({...newLine, location: e.target.value})}
                  placeholder="Ex: Salle serveur A, Bureau d'accueil"
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  id="inFaultFlow"
                  type="checkbox" 
                  checked={newLine.inFaultFlow}
                  onChange={(e) => setNewLine({...newLine, inFaultFlow: e.target.checked})}
                  className="h-4 w-4 rounded border border-gray-300"
                />
                <Label htmlFor="inFaultFlow" className="font-normal cursor-pointer">Inclure dans le flux de signalement de pannes</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddLineOpen(false)}>Annuler</Button>
              <Button onClick={handleAddLine}>Créer une ligne</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lignes totales</CardTitle>
            <PhoneIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opérationnel</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{working}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problèmes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{faulty}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registre d'état des lignes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro de ligne</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Dernière vérification</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myLines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono font-medium">{line.number}</TableCell>
                  <TableCell>{line.type}</TableCell>
                  <TableCell>{line.location}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(line.lastChecked), "PP p")}
                  </TableCell>
                  <TableCell>{getStatusBadge(line.status)}</TableCell>
                  <TableCell className="text-right">
                    {getActionForLine(line)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FaultReportDialog 
        lineId={reportingLineId} 
        open={!!reportingLineId} 
        onOpenChange={(open) => !open && setReportingLineId(null)} 
      />
    </div>
  );
}

function PhoneIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
