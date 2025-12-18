import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

interface ChatWindowProps {
    otherUserId: string;
    otherUserName: string;
    className?: string;
}

export function ChatWindow({ otherUserId, otherUserName, className }: ChatWindowProps) {
    const { user, messages, sendMessage, markAsRead } = useApp();
    const [content, setContent] = useState('');
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

    return (
        <div className={`flex flex-col h-full bg-card rounded-lg border shadow-sm ${className}`}>
            <div className="p-4 border-b flex items-center gap-2 bg-muted/30">
                <UserIcon className="h-4 w-4" />
                <h3 className="font-semibold">{otherUserName}</h3>
            </div>

            <ScrollArea className="flex-1 p-4 h-[400px]" ref={scrollRef}>
                <div className="space-y-4">
                    {chatMessages.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm my-8">
                            No messages yet. Start the conversation!
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
                                            {isMe && (msg.read ? ' • Read' : ' • Sent')}
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
                        placeholder="Type a message..."
                        className="min-h-[40px] resize-none"
                        rows={1}
                    />
                    <Button size="icon" onClick={handleSend} disabled={!content.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
