import { useState, useCallback } from 'react';
import { LineRequest, Line } from '../types';
import { convertLineRequest, convertLine } from './converters';

export function useLineRequests(setLines: React.Dispatch<React.SetStateAction<Line[]>>) {
  const [lineRequests, setLineRequests] = useState<LineRequest[]>([]);

  const fetchLineRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/line-requests');
      if (res.ok) {
        const data = await res.json();
        setLineRequests((Array.isArray(data) ? data : []).map(convertLineRequest));
      }
    } catch (error) {
      console.error('Failed to load line requests', error);
    }
  }, []);

  const createLineRequest = async (requestedType: string, subsidiaryId: string, adminId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/line-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedType, subsidiaryId: parseInt(subsidiaryId), adminId: parseInt(adminId) }),
      });
      if (res.ok) {
        const newReq = convertLineRequest(await res.json());
        setLineRequests(prev => [newReq, ...prev]);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const approveLineRequest = async (id: string, assignedNumber: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/line-requests/${id}/approve`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedNumber })
      });
      if (res.ok) {
        const { request, line } = await res.json();
        setLineRequests(prev => prev.map(r => r.id === id ? convertLineRequest(request) : r));
        setLines(prev => [...prev, convertLine(line)]);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const rejectLineRequest = async (id: string, reason: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/line-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        const updated = convertLineRequest(await res.json());
        setLineRequests(prev => prev.map(r => r.id === id ? updated : r));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const deleteLineRequest = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/line-requests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLineRequests(prev => prev.filter(r => r.id !== id));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return {
    lineRequests,
    setLineRequests,
    fetchLineRequests,
    createLineRequest,
    approveLineRequest,
    rejectLineRequest,
    deleteLineRequest
  };
}
