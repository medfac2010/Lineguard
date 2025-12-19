import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

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
                </div>
            </DialogContent>
        </Dialog>
    );
}
