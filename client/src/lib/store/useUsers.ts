import { useState, useCallback } from 'react';
import { User, UserRole } from '../types';
import { convertUser } from './converters';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers((Array.isArray(data) ? data : []).map(convertUser));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

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
          avatar: updates.avatar,
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

  return {
    users,
    setUsers,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser
  };
}
