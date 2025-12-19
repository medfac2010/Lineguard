import { User, Line, Fault, Subsidiary, Message, LineRequest, LineTypeDefinition } from '../types';

// Helper to convert numeric IDs to string IDs for frontend compatibility
export const convertUser = (apiUser: any): User => ({
  id: String(apiUser.id),
  name: apiUser.name,
  role: apiUser.role,
  password: apiUser.password || undefined, // Password may not be included in API response
  subsidiaryId: apiUser.subsidiaryId ? String(apiUser.subsidiaryId) : undefined,
  avatar: apiUser.avatar || undefined,
});

export const convertLine = (apiLine: any): Line => ({
  id: String(apiLine.id),
  number: apiLine.number,
  type: apiLine.type,
  subsidiaryId: String(apiLine.subsidiaryId),
  location: apiLine.location,
  establishmentDate: apiLine.establishmentDate,
  status: apiLine.status,
  lastChecked: apiLine.lastChecked,
  inFaultFlow: apiLine.inFaultFlow ?? true,
});

export const convertFault = (apiFault: any): Fault => ({
  id: String(apiFault.id),
  lineId: String(apiFault.lineId),
  subsidiaryId: String(apiFault.subsidiaryId),
  declaredBy: String(apiFault.declaredBy),
  declaredAt: apiFault.declaredAt,
  symptoms: apiFault.symptoms,
  probableCause: apiFault.probableCause,
  status: apiFault.status,
  assignedTo: apiFault.assignedTo ? String(apiFault.assignedTo) : undefined,
  assignedAt: apiFault.assignedAt,
  resolvedAt: apiFault.resolvedAt,
  feedback: apiFault.feedback,
});

export const convertSubsidiary = (apiSub: any): Subsidiary => ({
  id: String(apiSub.id),
  name: apiSub.name,
});

export const convertLineType = (apiType: any): LineTypeDefinition => ({
  id: String(apiType.id),
  code: apiType.code,
  title: apiType.title,
});

export const convertMessage = (apiMsg: any): Message => ({
  id: String(apiMsg.id),
  senderId: String(apiMsg.senderId),
  receiverId: String(apiMsg.receiverId),
  content: apiMsg.content,
  read: Boolean(apiMsg.read),
  timestamp: apiMsg.timestamp,
});

export const convertLineRequest = (apiReq: any): LineRequest => ({
  id: String(apiReq.id),
  subsidiaryId: String(apiReq.subsidiaryId),
  requestedType: apiReq.requestedType,
  assignedNumber: apiReq.assignedNumber,
  adminId: String(apiReq.adminId),
  status: apiReq.status,
  rejectionReason: apiReq.rejectionReason,
  createdAt: apiReq.createdAt,
  respondedAt: apiReq.respondedAt,
});
