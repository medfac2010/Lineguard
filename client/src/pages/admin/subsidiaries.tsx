import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export default function AdminSubsidiaries() {
  const { subsidiaries, addSubsidiary, updateSubsidiary, deleteSubsidiary, lines } = useApp();
  const { toast } = useToast();
  const [newSubName, setNewSubName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubsidiary, setEditingSubsidiary] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newSubName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la filiale est requis.",
        variant: "destructive",
      });
      return;
    }
    
    addSubsidiary(newSubName);
    toast({
      title: "Filiale créée",
      description: `${newSubName} a été créée.`,
      className: "bg-success text-success-foreground border-none"
    });
    setNewSubName("");
    setIsDialogOpen(false);
  };

  const handleEdit = (sub: any) => {
    setEditingSubsidiary(sub.id);
    setNewSubName(sub.name);
    setIsDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!newSubName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la filiale est requis.",
        variant: "destructive",
      });
      return;
    }

    if (!editingSubsidiary) return;

    const success = await updateSubsidiary(editingSubsidiary, newSubName);
    
    if (success) {
      toast({
        title: "Filiale modifiée",
        description: `La filiale a été mise à jour.`,
        className: "bg-success text-success-foreground border-none"
      });
      setIsDialogOpen(false);
      setEditingSubsidiary(null);
      setNewSubName("");
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la filiale. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsDialogOpen(false);
      setEditingSubsidiary(null);
      setNewSubName("");
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleDelete = (id: string, name: string) => {
    // Check if subsidiary has active lines
    const hasLines = lines.some(l => l.subsidiaryId === id);
    if (hasLines) {
      toast({
        title: "Impossible de supprimer",
        description: "Cette filiale possède des lignes associées. Supprimez d'abord les lignes.",
        variant: "destructive",
      });
      return;
    }

    deleteSubsidiary(id);
    toast({
      title: "Filiale supprimée",
      description: `${name} a été supprimé.`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des filiales</h1>
          <p className="text-muted-foreground">Créer et supprimer des unités commerciales</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSubsidiary(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une filiale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubsidiary ? "Modifier la filiale" : "Créer une filiale"}</DialogTitle>
              <DialogDescription>
                {editingSubsidiary ? "Modifier le nom de la filiale." : "Saisissez le nom de la nouvelle filiale ou succursale."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="name" className="mb-2 block">Nom</Label>
              <Input 
                id="name" 
                value={newSubName} 
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="e.g. West Coast Division" 
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleDialogClose(false)}>Annuler</Button>
              <Button onClick={editingSubsidiary ? handleUpdate : handleAdd}>
                {editingSubsidiary ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filiales actives</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subsidiaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Aucune filiale trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                subsidiaries.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{sub.id}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(sub)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Modifier</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(sub.id, sub.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Supprimer</span>
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
    </div>
  );
}
