import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, MoveDiagonal2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SubsidiaryAllLines() {
  const { user, lines, addLine, deleteLine, toggleLineInFaultFlow, lineTypes } = useApp();
  const { toast } = useToast();
  const [isAddLineOpen, setIsAddLineOpen] = useState(false);
  const [newLine, setNewLine] = useState({ number: "", type: lineTypes[0]?.code || "", location: "", inFaultFlow: true });
  const [lineToDelete, setLineToDelete] = useState<string | null>(null);

  // All lines for this user's subsidiary
  const myLines = lines.filter(l => l.subsidiaryId === user?.subsidiaryId);

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

  const handleToggleFaultFlow = (lineId: string) => {
    toggleLineInFaultFlow(lineId);
    const line = myLines.find(l => l.id === lineId);
    const newStatus = line?.inFaultFlow ? "supprimée de" : "ajoutée à";
    toast({ 
      title: "Mise à jour", 
      description: `Ligne ${newStatus} le flux de signalement de pannes.` 
    });
  };

  const handleDeleteLine = async () => {
    if (!lineToDelete) return;
    
    const success = await deleteLine(lineToDelete);
    if (success) {
      toast({ 
        title: "Ligne supprimée", 
        description: "La ligne a été supprimée avec succès.",
        className: "bg-success text-success-foreground border-none"
      });
      setLineToDelete(null);
    } else {
      toast({ 
        title: "Erreur", 
        description: "Impossible de supprimer la ligne. Veuillez réessayer.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Toutes les lignes</h1>
          <p className="text-muted-foreground">Gérer toutes les lignes téléphoniques et les paramètres de flux de pannes</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Lignes ({myLines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro de ligne</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>État</TableHead>
                <TableHead>En flux de panne</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myLines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune ligne disponible. Créez-en une pour commencer.
                  </TableCell>
                </TableRow>
              ) : (
                myLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-mono font-medium">{line.number}</TableCell>
                    <TableCell className="text-sm">{line.type}</TableCell>
                    <TableCell className="text-sm">{line.location}</TableCell>
                    <TableCell>
                      {getStatusBadge(line.status)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={line.inFaultFlow ? "default" : "secondary"}>
                        {line.inFaultFlow ? "Oui" : "Non"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleToggleFaultFlow(line.id)}
                      >
                        <MoveDiagonal2 className="h-4 w-4 mr-1" />
                        Basculer
                      </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => setLineToDelete(line.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!lineToDelete} onOpenChange={(open) => !open && setLineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette ligne ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLine} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
