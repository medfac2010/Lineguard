import { useState, useCallback } from 'react';
import { Line, LineTypeDefinition } from '../types';
import { convertLine, convertLineType } from './converters';

export function useLines() {
  const [lines, setLines] = useState<Line[]>([]);
  const [lineTypes, setLineTypes] = useState<LineTypeDefinition[]>([]);

  const fetchLinesData = useCallback(async () => {
    try {
      const [linesRes, typesRes] = await Promise.all([
        fetch('/api/lines'),
        fetch('/api/line-types'),
      ]);

      if (linesRes.ok) {
        const data = await linesRes.json();
        setLines((Array.isArray(data) ? data : []).map(convertLine));
      }

      if (typesRes.ok) {
        const data = await typesRes.json();
        setLineTypes((Array.isArray(data) ? data : []).map(convertLineType));
      }
    } catch (error) {
      console.error('Failed to load lines data:', error);
    }
  }, []);

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

  const setLineStatus = async (id: string, status: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/lines/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setLines(prev => prev.map(l => l.id === id ? { ...l, status: status as any } : l));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
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

  return {
    lines,
    setLines,
    lineTypes,
    setLineTypes,
    fetchLinesData,
    addLine,
    deleteLine,
    toggleLineInFaultFlow,
    setLineStatus,
    addLineType,
    updateLineType,
    deleteLineType
  };
}
