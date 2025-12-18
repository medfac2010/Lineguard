import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Line, Fault, Subsidiary, UserRole, LineTypeDefinition, Message } from './types';
import { format } from 'date-fns';

interface AppState {
  user: User | null;
  lines: Line[];
  faults: Fault[];
  subsidiaries: Subsidiary[];
  users: User[];
  lineTypes: LineTypeDefinition[];
  messages: Message[];
  conversations: { userId: string, unread: number, lastMessage: Message }[];
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to convert numeric IDs to string IDs for frontend compatibility
const convertUser = (apiUser: any): User => ({
  id: String(apiUser.id),
  name: apiUser.name,
  role: apiUser.role,
  password: apiUser.password || undefined, // Password may not be included in API response
  subsidiaryId: apiUser.subsidiaryId ? String(apiUser.subsidiaryId) : undefined,
});

const convertLine = (apiLine: any): Line => ({
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

const convertFault = (apiFault: any): Fault => ({
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

const convertSubsidiary = (apiSub: any): Subsidiary => ({
  id: String(apiSub.id),
  name: apiSub.name,
});

const convertLineType = (apiType: any): LineTypeDefinition => ({
  id: String(apiType.id),
  code: apiType.code,
  title: apiType.title,
});

const convertMessage = (apiMsg: any): Message => ({
  id: String(apiMsg.id),
  senderId: String(apiMsg.senderId),
  receiverId: String(apiMsg.receiverId),
  content: apiMsg.content,
  read: Boolean(apiMsg.read),
  timestamp: apiMsg.timestamp,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [faults, setFaults] = useState<Fault[]>([]);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [lineTypes, setLineTypes] = useState<LineTypeDefinition[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<{ userId: string, unread: number, lastMessage: Message }[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial data from API
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [usersRes, subsRes, typesRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/subsidiaries'),
          fetch('/api/line-types'),
        ]);

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers((Array.isArray(data) ? data : []).map(convertUser));
        }

        if (subsRes.ok) {
          const data = await subsRes.json();
          setSubsidiaries((Array.isArray(data) ? data : []).map(convertSubsidiary));
        }

        if (typesRes.ok) {
          const data = await typesRes.json();
          setLineTypes((Array.isArray(data) ? data : []).map(convertLineType));
        }
      } catch (error) {
        console.error('Failed to load static data:', error);
      }
    };

    const loadDynamicData = async () => {
      try {
        const [linesRes, faultsRes] = await Promise.all([
          fetch('/api/lines'),
          fetch('/api/faults'),
        ]);

        if (linesRes.ok) {
          const data = await linesRes.json();
          setLines((Array.isArray(data) ? data : []).map(convertLine));
        }

        if (faultsRes.ok) {
          const data = await faultsRes.json();
          setFaults((Array.isArray(data) ? data : []).map(convertFault));
        }
      } catch (error) {
        console.error('Failed to load dynamic data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadStaticData();
    loadDynamicData();

    // Polling for dynamic data every 5 seconds
    const intervalId = setInterval(loadDynamicData, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Poll messages
  useEffect(() => {
    if (!user) return;

    const pollMessages = async () => {
      try {
        // If admin, load conversation list mainly
        if (user.role === 'admin') {
          const res = await fetch(`/api/messages/conversations?userId=${user.id}`);
          if (res.ok) {
            const data = await res.json();
            setConversations(data.map((c: any) => ({
              userId: String(c.userId),
              unread: c.unread,
              lastMessage: convertMessage(c.lastMessage)
            })));
          }

          // If a conversation is selected, load messages for it
          if (selectedConversation) {
            const msgRes = await fetch(`/api/messages/${selectedConversation}?userId=${user.id}`);
            if (msgRes.ok) {
              const data = await msgRes.json();
              setMessages(data.map(convertMessage));
            }
          }
        } else {
          // Regular user: always load messages with admin
          // Find admin user dynamically
          const adminUser = users.find(u => u.role === 'admin');
          const adminId = adminUser ? adminUser.id : '1'; // Fallback to '1' if not found, though should exist

          if (adminUser) {
            const msgRes = await fetch(`/api/messages/${adminId}?userId=${user.id}`);
            if (msgRes.ok) {
              const data = await msgRes.json();
              setMessages(data.map(convertMessage));
            }
          }
        }
      } catch (error) {
        console.error('Failed to poll messages:', error);
      }
    };

    pollMessages();
    const intervalId = setInterval(pollMessages, 2000); // 2s polling for chat
    return () => clearInterval(intervalId);
  }, [user, selectedConversation]);

  const login = async (userId: string, password?: string): Promise<boolean> => {
    if (!password) {
      return false;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          // Force refresh users to ensure we have the latest
          const usersRes = await fetch('/api/users');
          let currentUsers = users;
          if (usersRes.ok) {
            const userData = await usersRes.json();
            currentUsers = (Array.isArray(userData) ? userData : []).map(convertUser);
            setUsers(currentUsers);
          }

          const found = currentUsers.find(u => u.id === userId);
          if (found) {
            setUser(found);
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setMessages([]);
    setConversations([]);
    setSelectedConversation(null);
  };

  const addSubsidiary = async (name: string) => {
    try {
      const res = await fetch('/api/subsidiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const newSub = convertSubsidiary(await res.json());
        setSubsidiaries(prev => [...prev, newSub]);
      }
    } catch (error) {
      console.error('Failed to add subsidiary:', error);
    }
  };

  const updateSubsidiary = async (id: string, name: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/subsidiaries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const updatedSub = convertSubsidiary(await res.json());
        setSubsidiaries(prev => prev.map(s => s.id === id ? updatedSub : s));
        return true;
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to update subsidiary:', errorData.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Failed to update subsidiary:', error);
      return false;
    }
  };

  const deleteSubsidiary = async (id: string) => {
    try {
      await fetch(`/api/subsidiaries/${id}`, { method: 'DELETE' });
      setSubsidiaries(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete subsidiary:', error);
    }
  };

  const addUser = async (newUser: Omit<User, 'id'>) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name,
          role: newUser.role,
          password: newUser.password,
          subsidiaryId: newUser.subsidiaryId ? parseInt(newUser.subsidiaryId) : null,
        }),
      });
      if (res.ok) {
        const createdUser = convertUser(await res.json());
        setUsers(prev => [...prev, createdUser]);
      }
    } catch (error) {
      console.error('Failed to add user:', error);
    }
  };

  const updateUser = async (id: string, updates: Partial<Omit<User, 'id'>>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updates.name,
          role: updates.role,
          password: updates.password,
          subsidiaryId: updates.subsidiaryId ? parseInt(updates.subsidiaryId) : null,
        }),
      });
      if (res.ok) {
        const updatedUser = convertUser(await res.json());
        setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
        return true;
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to update user:', errorData.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      return false;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // First verify current password
      const verifyRes = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password: currentPassword }),
      });

      if (!verifyRes.ok) {
        const verifyData = await verifyRes.json();
        if (!verifyData.valid) {
          return false;
        }
      } else {
        const verifyData = await verifyRes.json();
        if (!verifyData.valid) {
          return false;
        }
      }

      // If current password is valid, update to new password
      const res = await fetch(`/api/users/${userId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      if (res.ok) {
        // Don't store password in client state for security
        const userToUpdate = users.find(u => u.id === userId);
        if (userToUpdate) {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: undefined } : u));
          if (user?.id === userId) {
            setUser({ ...user, password: undefined });
          }
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to change password:', error);
      return false;
    }
  };

  const addLine = async (number: string, type: any, subsidiaryId: string, location: string, inFaultFlow = true): Promise<boolean> => {
    try {
      const res = await fetch('/api/lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number,
          type,
          subsidiaryId: parseInt(subsidiaryId),
          location,
          inFaultFlow,
          status: 'working',
          // establishmentDate and lastChecked have default values in the schema
        }),
      });
      if (res.ok) {
        const newLine = convertLine(await res.json());
        setLines(prev => [...prev, newLine]);
        return true;
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to add line:', errorData.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Failed to add line:', error);
      return false;
    }
  };

  const deleteLine = async (lineId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/lines/${lineId}`, { method: 'DELETE' });
      if (res.ok) {
        setLines(prev => prev.filter(l => l.id !== lineId));
        return true;
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to delete line:', errorData.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Failed to delete line:', error);
      return false;
    }
  };

  const toggleLineInFaultFlow = async (lineId: string) => {
    try {
      await fetch(`/api/lines/${lineId}/toggle-fault-flow`, { method: 'PATCH' });
      setLines(prev => prev.map(l =>
        l.id === lineId ? { ...l, inFaultFlow: !l.inFaultFlow } : l
      ));
    } catch (error) {
      console.error('Failed to toggle fault flow:', error);
    }
  };

  const addLineType = async (code: string, title: string) => {
    try {
      const res = await fetch('/api/line-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, title }),
      });
      if (res.ok) {
        const newType = convertLineType(await res.json());
        setLineTypes(prev => [...prev, newType]);
      }
    } catch (error) {
      console.error('Failed to add line type:', error);
    }
  };

  const updateLineType = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/line-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const updated = convertLineType(await res.json());
        setLineTypes(prev => prev.map(lt => lt.id === id ? updated : lt));
      }
    } catch (error) {
      console.error('Failed to update line type:', error);
    }
  };

  const deleteLineType = async (id: string) => {
    try {
      await fetch(`/api/line-types/${id}`, { method: 'DELETE' });
      setLineTypes(prev => prev.filter(lt => lt.id !== id));
    } catch (error) {
      console.error('Failed to delete line type:', error);
    }
  };

  const declareFault = async (lineId: string, symptoms: string, cause: string) => {
    if (!user) {
      console.error('Cannot declare fault: no user logged in');
      return;
    }

    const line = lines.find(l => l.id === lineId);
    if (!line) {
      console.error('Cannot declare fault: line not found');
      return;
    }

    const subsidiaryId = parseInt(line.subsidiaryId || '0', 10);
    if (!subsidiaryId) {
      console.error('Cannot declare fault: invalid subsidiaryId for line', lineId);
      return;
    }

    try {
      const payload = {
        lineId: parseInt(lineId, 10),
        subsidiaryId,
        declaredBy: parseInt(user.id, 10),
        symptoms,
        probableCause: cause,
        status: 'open',
        declaredAt: new Date().toISOString(),
      };

      const res = await fetch('/api/faults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newFault = convertFault(await res.json());
        setFaults(prev => [...prev, newFault]);

        // Update line status
        await fetch(`/api/lines/${lineId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'faulty', lastChecked: new Date().toISOString() }),
        });
        setLines(prev => prev.map(l =>
          l.id === lineId ? { ...l, status: 'faulty', lastChecked: new Date().toISOString() } : l
        ));
      } else {
        const body = await res.json().catch(() => null);
        console.error('Failed to declare fault:', res.status, body);
      }
    } catch (error) {
      console.error('Failed to declare fault:', error);
    }
  };

  const confirmWorking = async (lineId: string) => {
    try {
      await fetch(`/api/lines/${lineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'working', lastChecked: new Date().toISOString() }),
      });
      setLines(prev => prev.map(l =>
        l.id === lineId ? { ...l, status: 'working', lastChecked: new Date().toISOString() } : l
      ));

      // Auto-resolve any open faults for this line
      setFaults(prev => prev.map(f => {
        if (f.lineId === lineId && f.status !== 'resolved') {
          fetch(`/api/faults/${f.id}/resolve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback: 'Auto-resolved by check' }),
          }).catch(console.error);
          return { ...f, status: 'resolved', resolvedAt: new Date().toISOString(), feedback: 'Auto-resolved by check' };
        }
        return f;
      }));
    } catch (error) {
      console.error('Failed to confirm working:', error);
    }
  };

  const assignFault = async (faultId: string, maintenanceUserId: string) => {
    try {
      const res = await fetch(`/api/faults/${faultId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceUserId: parseInt(maintenanceUserId) }),
      });
      if (res.ok) {
        const updated = convertFault(await res.json());
        setFaults(prev => prev.map(f => f.id === faultId ? updated : f));

        const fault = faults.find(f => f.id === faultId);
        if (fault) {
          await fetch(`/api/lines/${fault.lineId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'maintenance' }),
          });
          setLines(prev => prev.map(l =>
            l.id === fault.lineId ? { ...l, status: 'maintenance' } : l
          ));
        }
      }
    } catch (error) {
      console.error('Failed to assign fault:', error);
    }
  };

  const resolveFault = async (faultId: string, feedback: string) => {
    try {
      const res = await fetch(`/api/faults/${faultId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      if (res.ok) {
        const updated = convertFault(await res.json());
        setFaults(prev => prev.map(f => f.id === faultId ? updated : f));

        const fault = faults.find(f => f.id === faultId);
        if (fault) {
          await fetch(`/api/lines/${fault.lineId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'working', lastChecked: new Date().toISOString() }),
          });
          setLines(prev => prev.map(l =>
            l.id === fault.lineId ? { ...l, status: 'working', lastChecked: new Date().toISOString() } : l
          ));
        }
      }
    } catch (error) {
      console.error('Failed to resolve fault:', error);
    }
  };

  const sendMessage = async (receiverId: string, content: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: parseInt(user.id),
          receiverId: parseInt(receiverId),
          content
        }),
      });
      if (res.ok) {
        // Force refresh messages to get the new one (and any others)
        // Usually local update is faster, but polling will catch it soon too.
        // Let's optimistic update if polling is slow
        const newMessage = convertMessage(await res.json());
        setMessages(prev => [...prev, newMessage]);

        // If admin, also update/create conversation
        if (user.role === 'admin') {
          // This is minimal optimistic update
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  };

  const markAsRead = async (senderId: string) => {
    if (!user) return;
    try {
      await fetch(`/api/messages/${senderId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(user.id) }), // I am reading
      });
      // Local update: mark all messages from this sender as read
      setMessages(prev => prev.map(m => (m.senderId === senderId && m.receiverId === user.id) ? { ...m, read: true } : m));

      if (user.role === 'admin') {
        setConversations(prev => prev.map(c => c.userId === senderId ? { ...c, unread: 0 } : c));
      }
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  return (
    <AppContext.Provider value={{
      user, lines, faults, subsidiaries, users, lineTypes, loading, messages, conversations,
      login, logout, declareFault, confirmWorking, assignFault, resolveFault,
      addSubsidiary, updateSubsidiary, deleteSubsidiary, addUser, updateUser, deleteUser, changePassword, addLine, deleteLine, toggleLineInFaultFlow,
      addLineType, updateLineType, deleteLineType, sendMessage, markAsRead, setSelectedConversation
    }}>
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
