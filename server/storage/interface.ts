import { type InsertUser, type User, type InsertLine, type Line, type InsertFault, type Fault, type InsertSubsidiary, type Subsidiary, type InsertLineType, type LineType, type Message, type InsertMessage, type InsertLineRequest, type LineRequest } from "@shared/schema";

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

  createLineRequest(request: InsertLineRequest): Promise<LineRequest>;
  listLineRequests(): Promise<LineRequest[]>;
  updateLineRequestStatus(id: number, status: string, rejectionReason?: string): Promise<LineRequest>;
  deleteLineRequest(id: number): Promise<void>;

  createMessage(message: InsertMessage): Promise<Message>;
  listMessages(userId1: number, userId2: number): Promise<Message[]>;
  getUnreadCount(userId: number): Promise<number>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<void>;
  listConversations(userId: number): Promise<{ userId: number, unread: number, lastMessage: Message }[]>;
}
