import { getDb } from "../db";
import { messages } from "@shared/schema";
import { type InsertMessage, type Message } from "@shared/schema";
import { eq, or, and, desc, sql } from "drizzle-orm";

export class MessageStorage {
  async createMessage(message: InsertMessage): Promise<Message> {
    const db = await getDb();
    await db.insert(messages).values(message);
    const result = await db.select().from(messages).orderBy(desc(messages.id)).limit(1);
    return result[0];
  }

  async listMessages(userId1: number, userId2: number): Promise<Message[]> {
    const db = await getDb();
    // Get messages where sender is u1 and receiver is u2 OR sender is u2 and receiver is u1
    const msgs = await db.select().from(messages).where(
      or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      )
    ).orderBy(messages.timestamp);
    return msgs;
  }

  async getUnreadCount(userId: number): Promise<number> {
    const db = await getDb();
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(eq(messages.receiverId, userId), eq(messages.read, false)));
    return result[0]?.count || 0;
  }

  async markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    const db = await getDb();
    await db.update(messages)
      .set({ read: true })
      .where(and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId), eq(messages.read, false)));
  }

  async listConversations(userId: number): Promise<{ userId: number, unread: number, lastMessage: Message }[]> {
    const db = await getDb();
    // Complex query efficiently handled by fetching all messages involving user
    const userMessages = await db.select().from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.timestamp));

    const conversations = new Map<number, { userId: number, unread: number, lastMessage: Message }>();

    for (const msg of userMessages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversations.has(otherId)) {
        conversations.set(otherId, {
          userId: otherId,
          unread: 0,
          lastMessage: msg
        });
      }
      
      if (msg.receiverId === userId && !msg.read) {
        conversations.get(otherId)!.unread++;
      }
    }

    return Array.from(conversations.values());
  }
}
