import { getDb } from "../db";
import { lineRequests } from "@shared/schema";
import { type InsertLineRequest, type LineRequest } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class LineRequestStorage {
  async createLineRequest(request: InsertLineRequest): Promise<LineRequest> {
    const db = await getDb();
    await db.insert(lineRequests).values(request);
    const result = await db.select().from(lineRequests).orderBy(desc(lineRequests.id)).limit(1);
    return result[0];
  }

  async listLineRequests(): Promise<LineRequest[]> {
    const db = await getDb();
    return await db.select().from(lineRequests).orderBy(desc(lineRequests.createdAt));
  }

  async updateLineRequestStatus(id: number, status: string, rejectionReason?: string, assignedNumber?: string): Promise<LineRequest> {
    const db = await getDb();
    await db.update(lineRequests)
      .set({ 
        status, 
        rejectionReason,
        assignedNumber,
        respondedAt: new Date() 
      })
      .where(eq(lineRequests.id, id));
    
    const result = await db.select().from(lineRequests).where(eq(lineRequests.id, id));
    return result[0];
  }

  async deleteLineRequest(id: number): Promise<void> {
    const db = await getDb();
    await db.delete(lineRequests).where(eq(lineRequests.id, id));
  }
}
