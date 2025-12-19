import { getDb } from "../db";
import { lines, lineTypes } from "@shared/schema";
import { type InsertLine, type Line, type InsertLineType, type LineType } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class LineStorage {
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
}
