import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Lock, UserCircle } from "lucide-react";
import { AvatarPicker } from "@/components/AvatarPicker";

export default function SubsidiarySettings() {
  const { user, changePassword, updateUser } = useApp();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Erreur", description: "Tous les champs sont obligatoires.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }

    if (newPassword.length < 3) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 3 caractères.", variant: "destructive" });
      return;
    }

    if (user) {
      const success = await changePassword(user.id, currentPassword, newPassword);
      if (success) {
        toast({ title: "Succès", description: "Mot de passe changé avec succès.", className: "bg-success text-success-foreground border-none" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({ title: "Erreur", description: "Le mot de passe actuel est incorrect.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres du compte</h1>
        <p className="text-muted-foreground">Gérer votre compte et votre sécurité</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <AvatarPicker
              currentAvatar={selectedAvatar}
              onSelect={setSelectedAvatar}
              userName={user?.name || "Filiale"}
            />
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-medium text-lg">{user?.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
              <p className="text-xs text-muted-foreground pt-2">Cliquez sur l'avatar pour le modifier</p>
            </div>
          </div>
          <Button
            onClick={async () => {
              if (user && selectedAvatar) {
                const success = await updateUser(user.id, { avatar: selectedAvatar });
                if (success) {
                  toast({ title: "Succès", description: "Profil mis à jour avec succès.", className: "bg-success text-success-foreground border-none" });
                }
              }
            }}
            disabled={selectedAvatar === user?.avatar}
          >
            Enregistrer les modifications du profil
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Modifier le mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current">Mot de passe actuel</Label>
            <Input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Entrez le mot de passe actuel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">Nouveau mot de passe</Label>
            <Input
              id="new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Entrez le nouveau mot de passe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez le nouveau mot de passe"
            />
          </div>
          <Button onClick={handleChangePassword} className="w-full">Mettre à jour le mot de passe</Button>
        </CardContent>
      </Card>
    </div>
  );
}
