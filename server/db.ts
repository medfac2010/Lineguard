import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL not found in environment");

let dbInstance: any = null;

async function initializeDb() {
  if (dbInstance) return dbInstance;
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    dbInstance = drizzle(connection);
    return dbInstance;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

// Export as a promise-based getter
export async function getDb() {
  return initializeDb();
}

// For sync-like usage in routes, we'll handle this via a wrapper
export const db = {
  select: function() {
    throw new Error("Use getDb() for database operations");
  },
  insert: function() {
    throw new Error("Use getDb() for database operations");
  },
  update: function() {
    throw new Error("Use getDb() for database operations");
  },
  delete: function() {
    throw new Error("Use getDb() for database operations");
  },
} as any;

// Initialize on startup
initializeDb().catch(err => console.error("Database initialization failed:", err));
