export type UserRole = 'admin' | 'subsidiary' | 'maintenance';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  password?: string; // Mock password
  subsidiaryId?: string; // For subsidiary users
}

export interface LineTypeDefinition {
  id: string;
  code: string; // e.g., 'LS', 'IP_STD'
  title: string; // e.g., 'Specialized Line', 'IP Standard 4-Digit'
}

export type LineType = string;
export type LineStatus = 'working' | 'faulty' | 'maintenance' | 'archived';

export interface Line {
  id: string;
  number: string; // The phone number or 4-digit IP
  type: LineType;
  subsidiaryId: string;
  location: string;
  establishmentDate: string; // ISO date
  status: LineStatus;
  lastChecked: string; // ISO date
  inFaultFlow?: boolean; // Whether line is included in fault reporting flow
}

export interface Fault {
  id: string;
  lineId: string;
  subsidiaryId: string;
  declaredBy: string; // User ID
  declaredAt: string; // ISO date
  symptoms: string;
  probableCause: string;
  status: 'open' | 'assigned' | 'resolved';
  assignedTo?: string; // Maintenance User ID
  assignedAt?: string;
  resolvedAt?: string;
  feedback?: string; // From maintenance
}

export interface Subsidiary {
  id: string;
  name: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  timestamp: string; // ISO date
}
