import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User as UserIcon, Trash2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatWindowProps {
    otherUserId: string;
    otherUserName: string;
    className?: string;
}

export function ChatWindow({ otherUserId, otherUserName, className }: ChatWindowProps) {
    const { toast } = useToast();
    const { user, messages, sendMessage, markAsRead, deleteConversation } = useApp();
    const [content, setContent] = useState('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isInitDialogOpen, setIsInitDialogOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter messages relevant to this conversation
    const chatMessages = messages.filter(m =>
        (m.senderId === user?.id && m.receiverId === otherUserId) ||
        (m.senderId === otherUserId && m.receiverId === user?.id)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // Mark as read when window is open and we receive messages
    useEffect(() => {
        const unreadFromOther = chatMessages.some(m => m.senderId === otherUserId && !m.read);
        if (unreadFromOther) {
            markAsRead(otherUserId);
        }
    }, [chatMessages, otherUserId]);

    const handleSend = async () => {
        if (!content.trim()) return;
        const success = await sendMessage(otherUserId, content);
        if (success) {
            setContent('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const confirmDelete = async () => {
        const success = await deleteConversation(otherUserId);
        if (success) {
            toast({ title: "Conversation supprimée" });
        }
        setIsDeleteDialogOpen(false);
    };

    const confirmInit = async () => {
        // Delete first
        await deleteConversation(otherUserId);
        // Send welcome message
        await sendMessage(otherUserId, "Bonjour, je suis l'administrateur. Comment puis-je vous aider ?");
        toast({ title: "Conversation initialisée" });
        setIsInitDialogOpen(false);
    };

    return (
        <div className={`flex flex-col h-full bg-card rounded-lg border shadow-sm ${className}`}>
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                    <UserIcon className="h-4 w-4 shrink-0" />
                    <h3 className="font-semibold truncate">{otherUserName}</h3>
                </div>
                {user?.role === 'admin' && (
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 border-primary/20 hover:bg-primary/10 text-primary"
                            onClick={() => setIsInitDialogOpen(true)}
                        >
                            <RotateCcw className="h-4 w-4" />
                            <span className="text-xs font-semibold">Initialiser</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 border-destructive/20 hover:bg-destructive/10 text-destructive"
                            onClick={() => setIsDeleteDialogOpen(true)}
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="text-xs font-semibold">Supprimer</span>
                        </Button>
                    </div>
                )}
            </div>

            <ScrollArea className="flex-1 p-4 h-[400px]" ref={scrollRef}>
                <div className="space-y-4">
                    {chatMessages.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm my-8 italic">
                            Aucun message. Commencez la discussion !
                        </p>
                    ) : (
                        chatMessages.map(msg => {
                            const isMe = msg.senderId === user?.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[70%] rounded-lg p-3 ${isMe
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        <span className={`text-[10px] block mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                            {format(new Date(msg.timestamp), 'HH:mm')}
                                            {isMe && (msg.read ? ' • Lu' : ' • Envoyé')}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t mt-auto">
                <div className="flex gap-2">
                    <Textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Écrivez un message..."
                        className="min-h-[40px] resize-none"
                        rows={1}
                    />
                    <Button size="icon" onClick={handleSend} disabled={!content.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Confirmation Dialogs */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la conversation ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action supprimera définitivement tous les messages avec {otherUserName}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isInitDialogOpen} onOpenChange={setIsInitDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Initialiser la conversation ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cela supprimera les messages existants et enverra un message de bienvenue automatique.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmInit}>
                            Initialiser
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
