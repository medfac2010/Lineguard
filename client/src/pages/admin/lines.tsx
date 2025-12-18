import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function AdminLines() {
  const { lines, subsidiaries, deleteLine } = useApp();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [lineToDelete, setLineToDelete] = useState<string | null>(null);

  const filteredLines = lines.filter(l => 
    l.number.toLowerCase().includes(search.toLowerCase()) ||
    l.location.toLowerCase().includes(search.toLowerCase())
  );

  const getSubName = (subId: string) => subsidiaries.find(s => s.id === subId)?.name;

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventaire des lignes</h1>
        <p className="text-muted-foreground">Base de données principale de toutes les lignes spécialisées</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lignes ({filteredLines.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un numéro de ligne ou une localisation..." 
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Filiale</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              { filteredLines.length > 0 ? (
                filteredLines.map((line) => (  
                <TableRow key={line.id}>
                  <TableCell className="font-mono font-medium">{line.number}</TableCell>
                  <TableCell>{line.type}</TableCell>
                  <TableCell>{getSubName(line.subsidiaryId)}</TableCell>
                  <TableCell>{line.location}</TableCell>
                  <TableCell>
                    {line.status === 'working' && <Badge className="bg-success hover:bg-success/90">Opérationnel</Badge>}
                    {line.status === 'faulty' && <Badge variant="destructive">Panne</Badge>}
                    {line.status === 'maintenance' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En réparation</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => setLineToDelete(line.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune ligne trouvée.
                  </TableCell>
                </TableRow>
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
