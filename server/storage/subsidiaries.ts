import { getDb } from "../db";
import { subsidiaries } from "@shared/schema";
import { type InsertSubsidiary, type Subsidiary } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class SubsidiaryStorage {
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
}
