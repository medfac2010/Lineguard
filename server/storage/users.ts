import { getDb } from "../db";
import { users } from "@shared/schema";
import { type InsertUser, type User } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../password";

export class UserStorage {
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
}
