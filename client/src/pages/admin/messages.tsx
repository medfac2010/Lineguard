import React, { useState } from "react";
import { useApp } from "@/lib/store";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
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
import { formatDistanceToNow } from "date-fns";
import { Plus, Trash2, Search, MessageCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminMessages() {
    const { toast } = useToast();
    const { conversations, users, user, setSelectedConversation, deleteConversation, bulkDeleteConversations } = useApp();
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);

    const handleSelectUser = (id: string) => {
        setActiveUserId(id);
        setSelectedConversation(id);
    };

    const handleDeleteClick = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        setConversationToDelete(userId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (conversationToDelete) {
            const success = await deleteConversation(conversationToDelete);
            if (success) {
                toast({ title: "Conversation supprimée" });
                if (activeUserId === conversationToDelete) {
                    setActiveUserId(null);
                }
            }
            setConversationToDelete(null);
            setIsDeleteDialogOpen(false);
        }
    };

    const handleBulkDelete = async () => {
        const success = await bulkDeleteConversations(selectedUsers);
        if (success) {
            toast({ title: `${selectedUsers.length} conversations supprimées` });
            if (activeUserId && selectedUsers.includes(activeUserId)) {
                setActiveUserId(null);
            }
            setSelectedUsers([]);
        }
        setIsBulkDeleteDialogOpen(false);
    };

    const toggleUserSelection = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const getPartnerName = (partnerId: string) => {
        return users.find(u => u.id === partnerId)?.name || 'Utilisateur inconnu';
    };

    const filteredUsers = users.filter(u =>
        u.id !== user?.id &&
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !conversations.some(c => c.userId === u.id)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
                <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Nouvelle discussion
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Démarrer une nouvelle discussion</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher un utilisateur..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-2">
                                    {filteredUsers.length === 0 ? (
                                        <p className="text-center text-sm text-muted-foreground py-4">Aucun utilisateur trouvé</p>
                                    ) : (
                                        filteredUsers.map((u) => (
                                            <button
                                                key={u.id}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                                                onClick={() => {
                                                    handleSelectUser(u.id);
                                                    setIsNewChatOpen(false);
                                                }}
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{u.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-medium truncate">{u.name}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                                                </div>
                                                <UserPlus className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[700px]">
                {/* Conversation List */}
                <Card className="md:col-span-4 h-full flex flex-col">
                    <CardHeader className="py-4 border-b flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-lg">Discussions</CardTitle>
                        {selectedUsers.length > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 gap-2"
                                onClick={() => setIsBulkDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Supprimer ({selectedUsers.length})
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            {conversations.length === 0 ? (
                                <div className="p-8 text-center">
                                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                    <p className="text-muted-foreground text-sm italic">Aucune discussion en cours</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {conversations.map(conv => (
                                        <div
                                            key={conv.userId}
                                            onClick={() => handleSelectUser(conv.userId)}
                                            className={`group flex items-start gap-3 p-4 border-b transition-colors hover:bg-muted/50 cursor-pointer relative ${activeUserId === conv.userId ? 'bg-muted border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
                                                }`}
                                        >
                                            <div
                                                className="mt-1"
                                                onClick={(e) => toggleUserSelection(e, conv.userId)}
                                            >
                                                <Checkbox
                                                    checked={selectedUsers.includes(conv.userId)}
                                                    onCheckedChange={() => { }} // Handled by toggleUserSelection
                                                />
                                            </div>
                                            <Avatar className="h-10 w-10 shrink-0">
                                                <AvatarFallback>{getPartnerName(conv.userId).substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold truncate">{getPartnerName(conv.userId)}</span>
                                                    {conv.lastMessage && (
                                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                            {formatDistanceToNow(new Date(conv.lastMessage.timestamp), { addSuffix: true })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate leading-relaxed">
                                                    {conv.lastMessage ? conv.lastMessage.content : 'Pas de message'}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                                                {conv.unread > 0 && (
                                                    <Badge variant="destructive" className="rounded-full h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
                                                        {conv.unread}
                                                    </Badge>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                                                    onClick={(e) => handleDeleteClick(e, conv.userId)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Chat Area */}
                <div className="md:col-span-8 h-full">
                    {activeUserId ? (
                        <ChatWindow
                            otherUserId={activeUserId}
                            otherUserName={getPartnerName(activeUserId)}
                            className="h-full"
                        />
                    ) : (
                        <Card className="h-full flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <p>Select a conversation to start chatting</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Alert Dialogs */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la conversation ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action supprimera définitivement tous les messages de cette discussion.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer {selectedUsers.length} conversations ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tous les messages des conversations sélectionnées seront définitivement supprimés.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                            Tout supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
