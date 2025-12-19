import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Line, Fault, Subsidiary, Message, LineRequest, LineTypeDefinition } from './types';
import { useAuth } from './store/useAuth';
import { useSubsidiaries } from './store/useSubsidiaries';
import { useUsers } from './store/useUsers';
import { useLines } from './store/useLines';
import { useFaults } from './store/useFaults';
import { useMessages } from './store/useMessages';
import { useLineRequests } from './store/useLineRequests';

interface AppState {
  user: User | null;
  lines: Line[];
  faults: Fault[];
  subsidiaries: Subsidiary[];
  users: User[];
  lineTypes: LineTypeDefinition[];
  messages: Message[];
  conversations: { userId: string, unread: number, lastMessage: Message }[];
  lineRequests: LineRequest[];
  loading: boolean;
}

interface AppContextType extends AppState {
  login: (userId: string, password?: string) => Promise<boolean>;
  logout: () => void;
  declareFault: (lineId: string, symptoms: string, cause: string) => void;
  confirmWorking: (lineId: string) => void;
  assignFault: (faultId: string, maintenanceUserId: string) => void;
  resolveFault: (faultId: string, feedback: string) => void;
  addSubsidiary: (name: string) => void;
  updateSubsidiary: (id: string, name: string) => Promise<boolean>;
  deleteSubsidiary: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<Omit<User, 'id'>>) => Promise<boolean>;
  deleteUser: (id: string) => void;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  addLine: (number: string, type: any, subsidiaryId: string, location: string, inFaultFlow?: boolean) => Promise<boolean>;
  deleteLine: (lineId: string) => Promise<boolean>;
  toggleLineInFaultFlow: (lineId: string) => void;
  addLineType: (code: string, title: string) => void;
  updateLineType: (id: string, title: string) => void;
  deleteLineType: (id: string) => void;
  sendMessage: (receiverId: string, content: string) => Promise<boolean>;
  markAsRead: (senderId: string) => Promise<void>;
  setSelectedConversation: (userId: string | null) => void;
  deleteConversation: (otherUserId: string) => Promise<boolean>;
  bulkDeleteConversations: (otherUserIds: string[]) => Promise<boolean>;
  // Line Requests
  createLineRequest: (requestedType: string, subsidiaryId: string, adminId: string) => Promise<boolean>;
  approveLineRequest: (id: string, assignedNumber: string) => Promise<boolean>;
  rejectLineRequest: (id: string, reason: string) => Promise<boolean>;
  deleteLineRequest: (id: string) => Promise<boolean>;
  // Maintenance actions
  setLineStatus: (id: string, status: string) => Promise<boolean>;
  updateFaultFeedback: (id: string, feedback: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);

  // Initialize modular hooks
  const { users, setUsers, fetchUsers, addUser, updateUser, deleteUser } = useUsers();
  const { user, setUser, login, logout, changePassword } = useAuth(users, setUsers);
  const { subsidiaries, setSubsidiaries, fetchSubsidiaries, addSubsidiary, updateSubsidiary, deleteSubsidiary } = useSubsidiaries();
  const { lines, setLines, lineTypes, setLineTypes, fetchLinesData, addLine, deleteLine, toggleLineInFaultFlow, setLineStatus, addLineType, updateLineType, deleteLineType } = useLines();
  const { faults, setFaults, fetchFaults, declareFault, confirmWorking, assignFault, resolveFault, updateFaultFeedback } = useFaults(user, lines, setLines);
  const { messages, setMessages, conversations, setConversations, selectedConversation, setSelectedConversation, sendMessage, markAsRead, deleteConversation, bulkDeleteConversations } = useMessages(user, users);
  const { lineRequests, setLineRequests, fetchLineRequests, createLineRequest, approveLineRequest, rejectLineRequest, deleteLineRequest } = useLineRequests(setLines);

  // Load initial data
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUsers(),
          fetchSubsidiaries(),
          fetchLinesData(),
          fetchFaults(),
          fetchLineRequests()
        ]);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();

    // Polling for dynamic data
    const intervalId = setInterval(() => {
      fetchLinesData();
      fetchFaults();
      fetchLineRequests();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchUsers, fetchSubsidiaries, fetchLinesData, fetchFaults, fetchLineRequests]);

  const value: AppContextType = {
    // State
    user, lines, faults, subsidiaries, users, lineTypes, messages, conversations, lineRequests, loading,
    // Actions
    login, logout, declareFault, confirmWorking, assignFault, resolveFault,
    addSubsidiary, updateSubsidiary, deleteSubsidiary,
    addUser, updateUser, deleteUser, changePassword,
    addLine, deleteLine, toggleLineInFaultFlow, setLineStatus,
    addLineType, updateLineType, deleteLineType,
    sendMessage, markAsRead, setSelectedConversation,
    deleteConversation, bulkDeleteConversations,
    createLineRequest, approveLineRequest, rejectLineRequest, deleteLineRequest,
    updateFaultFeedback
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

