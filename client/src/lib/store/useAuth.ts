import { useState } from 'react';
import { User } from '../types';
import { convertUser } from './converters';

export function useAuth(users: User[], setUsers: React.Dispatch<React.SetStateAction<User[]>>) {
  const [user, setUser] = useState<User | null>(null);

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

  return {
    user,
    setUser,
    login,
    logout,
    changePassword
  };
}
