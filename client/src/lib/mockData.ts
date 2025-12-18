import { User, Line, Fault, Subsidiary, LineTypeDefinition } from './types';
import { subDays, subHours } from 'date-fns';

export const LINE_TYPES: LineTypeDefinition[] = [
  { id: 'lt1', code: 'LS', title: 'Specialized Line (LS)' },
  { id: 'lt2', code: 'IP_STD', title: 'IP Standard 4-Digit' }
];

export const SUBSIDIARIES: Subsidiary[] = [
  { id: 'sub1', name: 'Headquarters' },
  { id: 'sub2', name: 'North Branch' },
  { id: 'sub3', name: 'South Factory' },
];

export const USERS: User[] = [
  { id: 'admin1', name: 'System Administrator', role: 'admin', password: 'admin' },
  { id: 'user1', name: 'HQ Operator', role: 'subsidiary', subsidiaryId: 'sub1', password: 'user1' },
  { id: 'user2', name: 'North Manager', role: 'subsidiary', subsidiaryId: 'sub2', password: 'user2' },
  { id: 'maint1', name: 'Tech Support Team', role: 'maintenance', password: 'maint' },
];

export const LINES: Line[] = [
  { 
    id: 'l1', 
    number: 'LS-1024', 
    type: 'LS', 
    subsidiaryId: 'sub1', 
    location: 'Server Room A', 
    establishmentDate: '2023-01-15T00:00:00Z',
    status: 'working',
    lastChecked: new Date().toISOString(),
    inFaultFlow: true
  },
  { 
    id: 'l2', 
    number: '1001', 
    type: 'IP_STD', 
    subsidiaryId: 'sub1', 
    location: 'Reception', 
    establishmentDate: '2023-02-20T00:00:00Z',
    status: 'faulty',
    lastChecked: subDays(new Date(), 1).toISOString(),
    inFaultFlow: true
  },
  { 
    id: 'l3', 
    number: 'LS-9901', 
    type: 'LS', 
    subsidiaryId: 'sub2', 
    location: 'Warehouse Office', 
    establishmentDate: '2022-11-10T00:00:00Z',
    status: 'maintenance',
    lastChecked: subDays(new Date(), 2).toISOString(),
    inFaultFlow: true
  },
  { 
    id: 'l4', 
    number: '1002', 
    type: 'IP_STD', 
    subsidiaryId: 'sub2', 
    location: 'Sales Floor', 
    establishmentDate: '2023-05-15T00:00:00Z',
    status: 'working',
    lastChecked: new Date().toISOString(),
    inFaultFlow: false
  },
  { 
    id: 'l5', 
    number: 'LS-5500', 
    type: 'LS', 
    subsidiaryId: 'sub3', 
    location: 'Production Line 1', 
    establishmentDate: '2021-08-01T00:00:00Z',
    status: 'working',
    lastChecked: new Date().toISOString(),
    inFaultFlow: true
  }
];

export const FAULTS: Fault[] = [
  {
    id: 'f1',
    lineId: 'l2',
    subsidiaryId: 'sub1',
    declaredBy: 'user1',
    declaredAt: subDays(new Date(), 1).toISOString(),
    symptoms: 'No dial tone, intermittent noise',
    probableCause: 'Cable damage likely',
    status: 'open'
  },
  {
    id: 'f2',
    lineId: 'l3',
    subsidiaryId: 'sub2',
    declaredBy: 'user2',
    declaredAt: subDays(new Date(), 2).toISOString(),
    symptoms: 'Connection drops every 5 minutes',
    probableCause: 'Router configuration',
    status: 'assigned',
    assignedTo: 'maint1',
    assignedAt: subHours(new Date(), 5).toISOString()
  }
];
