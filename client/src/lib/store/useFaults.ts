import { useState, useCallback } from 'react';
import { Fault, Line, User } from '../types';
import { convertFault } from './converters';

export function useFaults(
  user: User | null,
  lines: Line[],
  setLines: React.Dispatch<React.SetStateAction<Line[]>>
) {
  const [faults, setFaults] = useState<Fault[]>([]);

  const fetchFaults = useCallback(async () => {
    try {
      const res = await fetch('/api/faults');
      if (res.ok) {
        const data = await res.json();
        setFaults((Array.isArray(data) ? data : []).map(convertFault));
      }
    } catch (error) {
      console.error('Failed to load faults:', error);
    }
  }, []);

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

  const updateFaultFeedback = async (id: string, feedback: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/faults/${id}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      if (res.ok) {
        setFaults(prev => prev.map(f => f.id === id ? { ...f, feedback } : f));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return {
    faults,
    setFaults,
    fetchFaults,
    declareFault,
    confirmWorking,
    assignFault,
    resolveFault,
    updateFaultFeedback
  };
}
