import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { UserRole } from "@/lib/types";

export default function AdminUsers() {
  const { users, subsidiaries, addUser, updateUser, deleteUser } = useApp();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  
  const [newUser, setNewUser] = useState({
    name: "",
    role: "subsidiary" as UserRole,
    password: "",
    subsidiaryId: ""
  });

  const getSubName = (subId?: string) => subId ? subsidiaries.find(s => s.id === subId)?.name : '-';

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.password) {
      toast({ title: "Erreur de validation", description: "Nom d'utilisateur et mot de passe requis.", variant: "destructive" });
      return;
    }
    
    if (newUser.role === 'subsidiary' && !newUser.subsidiaryId) {
      toast({ title: "Erreur de validation", description: "Une filiale est requise pour les utilisateurs filiales.", variant: "destructive" });
      return;
    }

    addUser({
      name: newUser.name,
      role: newUser.role,
      password: newUser.password,
      subsidiaryId: newUser.role === 'subsidiary' ? newUser.subsidiaryId : undefined
    });

    toast({ title: "Utilisateur créé", description: `${newUser.name} a été ajouté.` });
    setIsDialogOpen(false);
    setNewUser({ name: "", role: "subsidiary", password: "", subsidiaryId: "" });
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user.id);
    setNewUser({
      name: user.name,
      role: user.role,
      password: "", // Don't pre-fill password for security
      subsidiaryId: user.subsidiaryId || ""
    });
    setIsDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!newUser.name) {
      toast({ title: "Erreur de validation", description: "Nom d'utilisateur requis.", variant: "destructive" });
      return;
    }
    
    if (newUser.role === 'subsidiary' && !newUser.subsidiaryId) {
      toast({ title: "Erreur de validation", description: "Une filiale est requise pour les utilisateurs filiales.", variant: "destructive" });
      return;
    }

    if (!editingUser) return;

    const updates: any = {
      name: newUser.name,
      role: newUser.role,
      subsidiaryId: newUser.role === 'subsidiary' ? newUser.subsidiaryId : undefined
    };

    // Only update password if provided
    if (newUser.password) {
      updates.password = newUser.password;
    }

    const success = await updateUser(editingUser, updates);
    
    if (success) {
      toast({ 
        title: "Utilisateur modifié", 
        description: `${newUser.name} a été mis à jour.`,
        className: "bg-success text-success-foreground border-none"
      });
      setIsDialogOpen(false);
      setEditingUser(null);
      setNewUser({ name: "", role: "subsidiary", password: "", subsidiaryId: "" });
    } else {
      toast({ 
        title: "Erreur", 
        description: "Impossible de modifier l'utilisateur. Veuillez réessayer.", 
        variant: "destructive" 
      });
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsDialogOpen(false);
      setEditingUser(null);
      setNewUser({ name: "", role: "subsidiary", password: "", subsidiaryId: "" });
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    deleteUser(id);
    toast({ title: "Utilisateur supprimé", description: `${name} a été supprimé.` });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">Gérer les accès au système et les rôles</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingUser(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "Modifier l'utilisateur" : "Créer un nouvel utilisateur"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Modifier les informations de l'utilisateur." : "Ajouter un nouvel utilisateur au système."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom et prénom</Label>
                <Input 
                  id="name" 
                  value={newUser.name} 
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Belahreche mohamed" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(val: UserRole) => setNewUser({...newUser, role: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subsidiary">Utilisateur Daira</SelectItem>
                    <SelectItem value="maintenance">Service Maintenance</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newUser.role === 'subsidiary' && (
                <div className="grid gap-2">
                  <Label htmlFor="subsidiary">Daira</Label>
                  <Select 
                    value={newUser.subsidiaryId} 
                    onValueChange={(val) => setNewUser({...newUser, subsidiaryId: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectioné Dairas" />
                    </SelectTrigger>
                    <SelectContent>
                      {subsidiaries.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="password">mot de passe {editingUser && "(laisser vide pour ne pas modifier)"}</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={newUser.password} 
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder={editingUser ? "Laisser vide pour ne pas modifier" : "Définir le mot de passe de connexion"} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleDialogClose(false)}>Annuler</Button>
              <Button onClick={editingUser ? handleUpdateUser : handleAddUser}>
                {editingUser ? "Modifier" : "Créer un utilisateur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs du système</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Dairas</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="capitalize">
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>{getSubName(user.subsidiaryId)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
