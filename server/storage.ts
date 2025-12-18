import { getDb } from "./db";
import { users, lines, faults, subsidiaries, lineTypes, messages } from "@shared/schema";
import { type InsertUser, type User, type InsertLine, type Line, type InsertFault, type Fault, type InsertSubsidiary, type Subsidiary, type InsertLineType, type LineType, type Message, type InsertMessage } from "@shared/schema";
import { eq, or, and, desc, sql } from "drizzle-orm";
import { hashPassword } from "./password";
import { log } from "console";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  updateUserPassword(id: number, password: string): Promise<void>;

  getLine(id: number): Promise<Line | undefined>;
  listLines(): Promise<Line[]>;
  listLinesBySubsidiary(subsidiaryId: number): Promise<Line[]>;
  createLine(line: InsertLine): Promise<Line>;
  updateLine(id: number, updates: Partial<InsertLine>): Promise<Line>;
  deleteLine(id: number): Promise<void>;
  toggleLineInFaultFlow(id: number): Promise<void>;

  getFault(id: number): Promise<Fault | undefined>;
  listFaults(): Promise<Fault[]>;
  listFaultsBySubsidiary(subsidiaryId: number): Promise<Fault[]>;
  listFaultsByLine(lineId: number): Promise<Fault[]>;
  createFault(fault: InsertFault): Promise<Fault>;
  updateFault(id: number, updates: Partial<InsertFault>): Promise<Fault>;
  resolveFault(id: number, feedback: string): Promise<Fault>;
  assignFault(id: number, maintenanceUserId: number): Promise<Fault>;

  getSubsidiary(id: number): Promise<Subsidiary | undefined>;
  listSubsidiaries(): Promise<Subsidiary[]>;
  createSubsidiary(subsidiary: InsertSubsidiary): Promise<Subsidiary>;
  updateSubsidiary(id: number, updates: Partial<InsertSubsidiary>): Promise<Subsidiary>;
  deleteSubsidiary(id: number): Promise<void>;

  getLineType(id: number): Promise<LineType | undefined>;
  listLineTypes(): Promise<LineType[]>;
  createLineType(lineType: InsertLineType): Promise<LineType>;
  updateLineType(id: number, title: string): Promise<LineType>;
  deleteLineType(id: number): Promise<void>;

  createMessage(message: InsertMessage): Promise<Message>;
  listMessages(userId1: number, userId2: number): Promise<Message[]>;
  getUnreadCount(userId: number): Promise<number>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<void>;
  listConversations(userId: number): Promise<{ userId: number, unread: number, lastMessage: Message }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const db = await getDb();
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(name: string): Promise<User | undefined> {
    const db = await getDb();
    const result = await db.select().from(users).where(eq(users.name, name));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const db = await getDb();
    // Hash password before storing
    const hashedPassword = await hashPassword(user.password);
    await db.insert(users).values({ ...user, password: hashedPassword });
    const result = await db.select().from(users).where(eq(users.name, user.name)).limit(1);
    return result[0];
  }

  async listUsers(): Promise<User[]> {
    const db = await getDb();
    return await db.select().from(users);
  }

  async deleteUser(id: number): Promise<void> {
    const db = await getDb();
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const db = await getDb();
    // If password is being updated, hash it
    const updateData: any = { ...updates };
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }
    await db.update(users).set(updateData).where(eq(users.id, id));
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async updateUserPassword(id: number, password: string): Promise<void> {
    const db = await getDb();
    // Hash password before storing
    const hashedPassword = await hashPassword(password);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }

  async getLine(id: number): Promise<Line | undefined> {
    const db = await getDb();
    const result = await db.select().from(lines).where(eq(lines.id, id));
    return result[0];
  }

  async listLines(): Promise<Line[]> {
    const db = await getDb();
    return await db.select().from(lines);
  }

  async listLinesBySubsidiary(subsidiaryId: number): Promise<Line[]> {
    const db = await getDb();
    return await db.select().from(lines).where(eq(lines.subsidiaryId, subsidiaryId));
  }

  async createLine(line: InsertLine): Promise<Line> {
    const db = await getDb();
    await db.insert(lines).values(line);
    const result = await db.select().from(lines).where(eq(lines.number, line.number)).limit(1);
    return result[0];
  }

  async updateLine(id: number, updates: Partial<InsertLine>): Promise<Line> {
    const db = await getDb();
    await db.update(lines).set(updates).where(eq(lines.id, id));
    const result = await db.select().from(lines).where(eq(lines.id, id));
    return result[0];
  }

  async deleteLine(id: number): Promise<void> {
    const db = await getDb();
    await db.delete(lines).where(eq(lines.id, id));
  }

  async toggleLineInFaultFlow(id: number): Promise<void> {
    const db = await getDb();
    const line = await this.getLine(id);
    if (line) {
      await db.update(lines).set({ inFaultFlow: !line.inFaultFlow }).where(eq(lines.id, id));
    }
  }

  async getFault(id: number): Promise<Fault | undefined> {
    const db = await getDb();
    const result = await db.select().from(faults).where(eq(faults.id, id));
    return result[0];
  }

  async listFaults(): Promise<Fault[]> {
    const db = await getDb();
    return await db.select().from(faults);
  }

  async listFaultsBySubsidiary(subsidiaryId: number): Promise<Fault[]> {
    const db = await getDb();
    return await db.select().from(faults).where(eq(faults.subsidiaryId, subsidiaryId));
  }

  async listFaultsByLine(lineId: number): Promise<Fault[]> {
    const db = await getDb();
    return await db.select().from(faults).where(eq(faults.lineId, lineId));
  }

  async createFault(fault: InsertFault): Promise<Fault> {
    const db = await getDb();
    await db.insert(faults).values(fault);
    console.log('valeur de fault (createFault) :',fault)
    const result = await db.select().from(faults).orderBy(desc(faults.id)).limit(1);
    return result[0];
  }

  async updateFault(id: number, updates: Partial<InsertFault>): Promise<Fault> {
    const db = await getDb();
    await db.update(faults).set(updates).where(eq(faults.id, id));
    const result = await db.select().from(faults).where(eq(faults.id, id));
    return result[0];
  }

  async resolveFault(id: number, feedback: string): Promise<Fault> {
    const db = await getDb();
    await db.update(faults).set({ status: "resolved", feedback, resolvedAt: new Date() }).where(eq(faults.id, id));
    const result = await db.select().from(faults).where(eq(faults.id, id));
    return result[0];
  }

  async assignFault(id: number, maintenanceUserId: number): Promise<Fault> {
    const db = await getDb();
    await db.update(faults).set({ status: "assigned", assignedTo: maintenanceUserId, assignedAt: new Date() }).where(eq(faults.id, id));
    const result = await db.select().from(faults).where(eq(faults.id, id));
    return result[0];
  }

  async getSubsidiary(id: number): Promise<Subsidiary | undefined> {
    const db = await getDb();
    const result = await db.select().from(subsidiaries).where(eq(subsidiaries.id, id));
    return result[0];
  }

  async listSubsidiaries(): Promise<Subsidiary[]> {
    const db = await getDb();
    return await db.select().from(subsidiaries);
  }

  async createSubsidiary(subsidiary: InsertSubsidiary): Promise<Subsidiary> {
    const db = await getDb();
    await db.insert(subsidiaries).values(subsidiary);
    const result = await db.select().from(subsidiaries).orderBy(desc(subsidiaries.id)).limit(1);
    return result[0];
  }

  async updateSubsidiary(id: number, updates: Partial<InsertSubsidiary>): Promise<Subsidiary> {
    const db = await getDb();
    await db.update(subsidiaries).set(updates).where(eq(subsidiaries.id, id));
    const result = await db.select().from(subsidiaries).where(eq(subsidiaries.id, id));
    return result[0];
  }

  async deleteSubsidiary(id: number): Promise<void> {
    const db = await getDb();
    await db.delete(subsidiaries).where(eq(subsidiaries.id, id));
  }

  async getLineType(id: number): Promise<LineType | undefined> {
    const db = await getDb();
    const result = await db.select().from(lineTypes).where(eq(lineTypes.id, id));
    return result[0];
  }

  async listLineTypes(): Promise<LineType[]> {
    const db = await getDb();
    return await db.select().from(lineTypes);
  }

  async createLineType(lineType: InsertLineType): Promise<LineType> {
    const db = await getDb();
    await db.insert(lineTypes).values(lineType);
    const result = await db.select().from(lineTypes).orderBy(desc(lineTypes.id)).limit(1);
    return result[0];
  }

  async updateLineType(id: number, title: string): Promise<LineType> {
    const db = await getDb();
    await db.update(lineTypes).set({ title }).where(eq(lineTypes.id, id));
    const result = await db.select().from(lineTypes).where(eq(lineTypes.id, id));
    return result[0];
  }

  async deleteLineType(id: number): Promise<void> {
    const db = await getDb();
    await db.delete(lineTypes).where(eq(lineTypes.id, id));
  }

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

export const storage = new DatabaseStorage();
