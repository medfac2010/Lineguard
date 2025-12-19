import { useState, useCallback } from 'react';
import { Subsidiary } from '../types';
import { convertSubsidiary } from './converters';

export function useSubsidiaries() {
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);

  const fetchSubsidiaries = useCallback(async () => {
    try {
      const res = await fetch('/api/subsidiaries');
      if (res.ok) {
        const data = await res.json();
        setSubsidiaries((Array.isArray(data) ? data : []).map(convertSubsidiary));
      }
    } catch (error) {
      console.error('Failed to load subsidiaries:', error);
    }
  }, []);

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

  return {
    subsidiaries,
    setSubsidiaries,
    fetchSubsidiaries,
    addSubsidiary,
    updateSubsidiary,
    deleteSubsidiary
  };
}
