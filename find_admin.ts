
import { getDb } from './server/db';
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function findAdmin() {
  const db = await getDb();
  const admin = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  if (admin.length > 0) {
    console.log("Admin User found:", admin[0]);
  } else {
    console.log("No Admin user found!");
  }
  process.exit(0);
}

findAdmin();
