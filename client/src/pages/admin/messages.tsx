import { useApp } from "@/lib/store";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

export default function AdminMessages() {
    const { conversations, users, user, setSelectedConversation } = useApp();
    const [activeUserId, setActiveUserId] = useState<string | null>(null);

    const handleSelectUser = (id: string) => {
        setActiveUserId(id);
        setSelectedConversation(id);
    };

    const getPartnerName = (partnerId: string) => {
        return users.find(u => u.id === partnerId)?.name || 'Unknown User';
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[600px]">
                {/* Conversation List */}
                <Card className="md:col-span-4 h-full flex flex-col">
                    <CardHeader className="py-4">
                        <CardTitle className="text-lg">Conversations</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            {conversations.length === 0 ? (
                                <p className="p-4 text-center text-muted-foreground text-sm">No conversations yet</p>
                            ) : (
                                <div className="flex flex-col">
                                    {conversations.map(conv => (
                                        <button
                                            key={conv.userId}
                                            onClick={() => handleSelectUser(conv.userId)}
                                            className={`flex items-start gap-4 p-4 text-left transition-colors hover:bg-muted/50 ${activeUserId === conv.userId ? 'bg-muted' : ''
                                                }`}
                                        >
                                            <Avatar>
                                                <AvatarFallback>{getPartnerName(conv.userId).substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold truncate">{getPartnerName(conv.userId)}</span>
                                                    {conv.lastMessage && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(conv.lastMessage.timestamp), { addSuffix: true })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {conv.lastMessage ? conv.lastMessage.content : 'No messages'}
                                                </p>
                                            </div>
                                            {conv.unread > 0 && (
                                                <Badge variant="destructive" className="ml-auto rounded-full h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                                                    {conv.unread}
                                                </Badge>
                                            )}
                                        </button>
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
        </div>
    );
}
