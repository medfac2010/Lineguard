import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminLineTypes() {
  const { lineTypes, addLineType, updateLineType, deleteLineType } = useApp();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [editTitle, setEditTitle] = useState("");

  const handleAddType = () => {
    if (!newCode.trim() || !newTitle.trim()) {
      toast({ title: "Erreur", description: "Le code et le titre sont requis.", variant: "destructive" });
      return;
    }
    
    if (lineTypes.some(lt => lt.code === newCode)) {
      toast({ title: "Erreur", description: "Ce code existe déjà.", variant: "destructive" });
      return;
    }

    addLineType(newCode, newTitle);
    toast({ title: "Succès", description: "Le type de ligne a été ajouté avec succès." });
    setIsAddOpen(false);
    setNewCode("");
    setNewTitle("");
  };

  const handleUpdateType = (id: string) => {
    if (!editTitle.trim()) {
      toast({ title: "Erreur", description: "Le titre ne peut pas être vide.", variant: "destructive" });
      return;
    }
    
    updateLineType(id, editTitle);
    toast({ title: "Succès", description: "Le type de ligne a été mis à jour avec succès." });
    setEditingId(null);
    setEditTitle("");
  };

  const handleDeleteType = (id: string) => {
    deleteLineType(id);
    toast({ title: "Suppression", description: "Le type de ligne a été supprimé avec succès." });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des types de lignes</h1>
          <p className="text-muted-foreground">Configurer les types de lignes disponibles dans le système</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un type de ligne
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau type de ligne</DialogTitle>
              <DialogDescription>Ajouter un nouveau type de ligne au système</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code du type</Label>
                <Input 
                  id="code"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="Ex: LS, IP_STD, VOIP"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Titre du type</Label>
                <Input 
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Ligne spécialisée, IP Standard 4-Digit"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Annuler</Button>
              <Button onClick={handleAddType}>Créer le type</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Types de lignes disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lineTypes.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun type de ligne défini.</p>
            ) : (
              lineTypes.map(lineType => (
                <div key={lineType.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 px-3 py-1 rounded font-mono font-semibold text-primary">
                        {lineType.code}
                      </div>
                      {editingId === lineType.id ? (
                        <Input 
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 max-w-md"
                        />
                      ) : (
                        <p className="text-foreground font-medium">{lineType.title}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {editingId === lineType.id ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => handleUpdateType(lineType.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingId(lineType.id);
                            setEditTitle(lineType.title);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteType(lineType.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
