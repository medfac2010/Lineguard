import { getDb } from "../db";
import { faults } from "@shared/schema";
import { type InsertFault, type Fault } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class FaultStorage {
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
}
