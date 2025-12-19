import { useState, useCallback, useEffect } from 'react';
import { Message, User } from '../types';
import { convertMessage } from './converters';

export function useMessages(user: User | null, users: User[]) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<{ userId: string, unread: number, lastMessage: Message }[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const pollMessages = useCallback(async () => {
    if (!user) return;

    try {
      // If admin, load conversation list mainly
      if (user.role === 'admin') {
        const res = await fetch(`/api/messages/conversations?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setConversations(data.map((c: any) => ({
            userId: String(c.userId),
            unread: c.unread,
            lastMessage: convertMessage(c.lastMessage)
          })));
        }

        // If a conversation is selected, load messages for it
        if (selectedConversation) {
          const msgRes = await fetch(`/api/messages/${selectedConversation}?userId=${user.id}`);
          if (msgRes.ok) {
            const data = await msgRes.json();
            setMessages(data.map(convertMessage));
          }
        }
      } else {
        // Regular user: always load messages with admin
        // Find admin user dynamically
        const adminUser = users.find(u => u.role === 'admin');
        const adminId = adminUser ? adminUser.id : '1'; // Fallback to '1' if not found, though should exist

        if (adminUser) {
          const msgRes = await fetch(`/api/messages/${adminId}?userId=${user.id}`);
          if (msgRes.ok) {
            const data = await msgRes.json();
            setMessages(data.map(convertMessage));
          }
        }
      }
    } catch (error) {
      console.error('Failed to poll messages:', error);
    }
  }, [user, users, selectedConversation]);

  useEffect(() => {
    pollMessages();
    const intervalId = setInterval(pollMessages, 2000); // 2s polling for chat
    return () => clearInterval(intervalId);
  }, [pollMessages]);

  const sendMessage = async (receiverId: string, content: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: parseInt(user.id),
          receiverId: parseInt(receiverId),
          content
        }),
      });
      if (res.ok) {
        const newMessage = convertMessage(await res.json());
        setMessages(prev => [...prev, newMessage]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  };

  const markAsRead = async (senderId: string) => {
    if (!user) return;
    try {
      await fetch(`/api/messages/${senderId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(user.id) }), // I am reading
      });
      // Local update: mark all messages from this sender as read
      setMessages(prev => prev.map(m => (m.senderId === senderId && m.receiverId === user.id) ? { ...m, read: true } : m));

      if (user.role === 'admin') {
        setConversations(prev => prev.map(c => c.userId === senderId ? { ...c, unread: 0 } : c));
      }
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  const deleteConversation = async (otherUserId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch(`/api/messages/${otherUserId}?userId=${user.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.userId !== otherUserId));
        if (selectedConversation === otherUserId) {
          setSelectedConversation(null);
          setMessages([]);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      return false;
    }
  };

  const bulkDeleteConversations = async (otherUserIds: string[]): Promise<boolean> => {
    if (!user || otherUserIds.length === 0) return false;
    try {
      const res = await fetch('/api/messages/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, otherUserIds }),
      });
      if (res.ok) {
        setConversations(prev => prev.filter(c => !otherUserIds.includes(c.userId)));
        if (selectedConversation && otherUserIds.includes(selectedConversation)) {
          setSelectedConversation(null);
          setMessages([]);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      return false;
    }
  };

  return {
    messages,
    setMessages,
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    sendMessage,
    markAsRead,
    deleteConversation,
    bulkDeleteConversations
  };
}
