import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@/lib/types";
import { Shield, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LoginPage() {
  const { users, login } = useApp();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [selectedUserId, setSelectedUserId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un utilisateur.",
        variant: "destructive"
      });
      return;
    }

    const success = await login(selectedUserId, password);

    if (success) {
      const user = users.find(u => u.id === selectedUserId);
      if (user) {
        if (user.role === 'admin') setLocation('/admin');
        else if (user.role === 'subsidiary') setLocation('/');
        else if (user.role === 'maintenance') setLocation('/maintenance');
      }
    } else {
      toast({
        title: "Authentification échouée",
        description: "Mot de passe incorrect. Veuillez réessayer.",
        variant: "destructive"
      });
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">LineGuard</h1>
          <p className="text-muted-foreground">Système de Maintenance Télécom Entreprise</p>
        </div>

        <Card className="border-muted-foreground/10 shadow-xl">
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>Entrez vos identifiants pour accéder au système</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user">Sélectionnez votre compte</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Choisissez votre compte..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <span className="font-medium">{user.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">({user.role})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin(e as any)}
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Connexion
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <p>Transmissions Nationales Wilaya de Sétif</p>
          <p className="font-mono">Développé par : Belahreche Mohamed Chef de Service Exploitation <br />Tel Fixe: 036617125 (04)Chiffres: 5060/5260 <br />Email: webmaster@wilayasetif.dz</p>
        </div>
      </div>
    </div>
  );
}
