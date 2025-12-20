import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Fault, Line, Subsidiary, User } from './types';

function fmtDate(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
}

export function exportFaultsPdf(faults: Fault[], lines: Line[], subsidiaries: Subsidiary[], users: User[], fileName = 'pannes_par_filiale.pdf') {
  const groups = subsidiaries.map(s => ({ subsidiary: s, rows: faults.filter(f => f.subsidiaryId === s.id) }))
    .filter(g => g.rows.length > 0);

  if (groups.length === 0 && faults.length > 0) {
    groups.push({ subsidiary: { id: 'all', name: 'Toutes les filiales' }, rows: faults });
  }

  const doc = new jsPDF('p', 'mm', 'a4');

  groups.forEach((g, idx) => {
    if (idx > 0) doc.addPage();

    const now = new Date();
    doc.setFontSize(14);
    doc.text(`${g.subsidiary.name}`, 14, 16);
    doc.setFontSize(9);
    doc.text(`Exporté le ${now.toLocaleString()}`, 14, 22);

    const head = [['Date', 'Ligne', 'Type', 'Symptômes', 'Cause probable', 'Statut', 'Assigné à']];
    const body = g.rows.map(f => {
      const line = lines.find(l => l.id === f.lineId);
      const assigned = f.assignedTo ? users.find(u => u.id === f.assignedTo)?.name || f.assignedTo : 'Non assigné';
      return [
        fmtDate(f.declaredAt),
        line?.number || 'N/A',
        line?.type || 'N/A',
        f.symptoms,
        f.probableCause,
        f.status,
        assigned
      ];
    });

    autoTable(doc, {
      startY: 28,
      head,
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [240, 240, 240] },
      margin: { left: 14, right: 14 }
    });
  });

  doc.save(fileName);
}

export function exportFaultsXlsx(faults: Fault[], lines: Line[], subsidiaries: Subsidiary[], users: User[], fileName = 'pannes_par_filiale.xlsx') {
  const wb = XLSX.utils.book_new();

  const groups = subsidiaries.map(s => ({ subsidiary: s, rows: faults.filter(f => f.subsidiaryId === s.id) }))
    .filter(g => g.rows.length > 0);

  if (groups.length === 0 && faults.length > 0) {
    groups.push({ subsidiary: { id: 'all', name: 'Toutes les filiales' }, rows: faults });
  }

  groups.forEach(g => {
    const aoa = [
      ['Date', 'Ligne', 'Type', 'Symptômes', 'Cause probable', 'Statut', 'Assigné à'] as string[],
      ...(g.rows.map(f => {
        const line = lines.find(l => l.id === f.lineId);
        const assigned = f.assignedTo ? users.find(u => u.id === f.assignedTo)?.name || f.assignedTo : 'Non assigné';
        return [fmtDate(f.declaredAt), line?.number || 'N/A', line?.type || 'N/A', f.symptoms, f.probableCause, f.status, assigned] as string[];
      }))
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const now = new Date().toLocaleString();
    XLSX.utils.sheet_add_aoa(ws, [[`Exporté le ${now}`]], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(ws, aoa, { origin: 'A3' });

    const sheetName = g.subsidiary.name.slice(0, 31) || 'Feuille';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  XLSX.writeFile(wb, fileName);
}
