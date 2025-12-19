import { sql } from "drizzle-orm";
import { mysqlTable, text, varchar, timestamp, boolean, int } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// LINE TYPES
export const lineTypes = mysqlTable("line_types", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  title: text("title").notNull(),
});

export const insertLineTypeSchema = createInsertSchema(lineTypes).omit({ id: true });
export type InsertLineType = z.infer<typeof insertLineTypeSchema>;
export type LineType = typeof lineTypes.$inferSelect;

// SUBSIDIARIES
export const subsidiaries = mysqlTable("subsidiaries", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
});

export const insertSubsidiarySchema = createInsertSchema(subsidiaries).omit({ id: true });
export type InsertSubsidiary = z.infer<typeof insertSubsidiarySchema>;
export type Subsidiary = typeof subsidiaries.$inferSelect;

// USERS
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'admin' | 'subsidiary' | 'maintenance'
  password: text("password").notNull(),
  subsidiaryId: int("subsidiary_id").references(() => subsidiaries.id),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// LINES
export const lines = mysqlTable("lines", {
  id: int("id").autoincrement().primaryKey(),
  number: varchar("number", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  subsidiaryId: int("subsidiary_id").notNull().references(() => subsidiaries.id),
  location: text("location").notNull(),
  establishmentDate: timestamp("establishment_date").notNull().defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("working"), // 'working' | 'faulty' | 'maintenance' | 'archived' | 'out_of_service'
  lastChecked: timestamp("last_checked").notNull().defaultNow(),
  inFaultFlow: boolean("in_fault_flow").default(true),
});

export const insertLineSchema = createInsertSchema(lines).omit({ id: true });
export type InsertLine = z.infer<typeof insertLineSchema>;
export type Line = typeof lines.$inferSelect;

// LINE REQUESTS
export const lineRequests = mysqlTable("line_requests", {
  id: int("id").autoincrement().primaryKey(),
  subsidiaryId: int("subsidiary_id").notNull().references(() => subsidiaries.id),
  requestedType: varchar("requested_type", { length: 50 }).notNull(), // Stores line type code e.g. 'LS', 'IP_STD'
  assignedNumber: varchar("assigned_number", { length: 100 }), // Filled by maintenance on approval
  adminId: int("admin_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const insertLineRequestSchema = createInsertSchema(lineRequests).omit({ id: true, createdAt: true, respondedAt: true });
export type InsertLineRequest = z.infer<typeof insertLineRequestSchema>;
export type LineRequest = typeof lineRequests.$inferSelect;

// FAULTS
export const faults = mysqlTable("faults", {
  id: int("id").autoincrement().primaryKey(),
  lineId: int("line_id").notNull().references(() => lines.id),
  subsidiaryId: int("subsidiary_id").notNull().references(() => subsidiaries.id),
  declaredBy: int("declared_by").notNull().references(() => users.id),
  declaredAt: timestamp("declared_at").notNull().defaultNow(),
  symptoms: text("symptoms").notNull(),
  probableCause: text("probable_cause").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("open"), // 'open' | 'assigned' | 'resolved'
  assignedTo: int("assigned_to").references(() => users.id),
  assignedAt: timestamp("assigned_at"),
  resolvedAt: timestamp("resolved_at"),
  feedback: text("feedback"),
});

export const insertFaultSchema = createInsertSchema(faults).omit({ id: true });
export type InsertFault = z.infer<typeof insertFaultSchema>;
export type Fault = typeof faults.$inferSelect;

// MESSAGES
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("sender_id").notNull().references(() => users.id),
  receiverId: int("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
