import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
];

interface AvatarPickerProps {
    currentAvatar?: string;
    onSelect: (avatar: string) => void;
    userName: string;
}

export function AvatarPicker({ currentAvatar, onSelect, userName }: AvatarPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast({ title: 'Erreur', description: 'Le fichier doit être une image.', variant: 'destructive' });
            return;
        }
        // Limit to 60KB to fit DB text column
        if (file.size > 60 * 1024) {
            toast({ title: 'Erreur', description: "L'image est trop volumineuse (max 60KB). Réduisez la taille ou utilisez un avatar pré-défini.", variant: 'destructive' });
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            onSelect(result);
            setIsOpen(false);
        };
        reader.onerror = () => {
            toast({ title: 'Erreur', description: "Impossible de lire le fichier.", variant: 'destructive' });
        };
        reader.readAsDataURL(file);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="relative group cursor-pointer">
                    <Avatar className="h-24 w-24 border-2 border-primary/20 group-hover:border-primary transition-colors">
                        {currentAvatar ? (
                            <AvatarImage src={currentAvatar} alt={userName} />
                        ) : (
                            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                {userName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Changer</span>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Choisir un avatar</DialogTitle>
                </DialogHeader>

                <div className="py-2">
                    <label className="inline-block w-full relative">
                        <Button variant="secondary" className="w-full">Téléverser depuis l'ordinateur</Button>
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                        />
                    </label>
                </div>

                <div className="grid grid-cols-4 gap-4 py-4">
                    {AVATARS.map((avatar) => (
                        <button
                            key={avatar}
                            type="button"
                            className={cn(
                                "relative rounded-full border-2 transition-all p-1",
                                currentAvatar === avatar ? "border-primary bg-primary/5" : "border-transparent hover:border-muted"
                            )}
                            onClick={() => {
                                onSelect(avatar);
                                setIsOpen(false);
                            }}
                        >
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={avatar} alt="Avatar option" />
                            </Avatar>
                            {currentAvatar === avatar && (
                                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-sm">
                                    <Check className="h-3 w-3" />
                                </div>
                            )}
                        </button>
                    ))}

                    {/* If the user has selected a custom avatar (data URL), show it as the first option */}
                    {currentAvatar && currentAvatar.startsWith('data:') && (
                        <div className="col-span-4 mt-2 flex items-center gap-2">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={currentAvatar} alt="Votre avatar" />
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Avatar personnalisé</span>
                                <span className="text-xs text-muted-foreground">Téléversé depuis votre ordinateur</span>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
