import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Line, Subsidiary } from './types';

function statusLabel(status: string) {
  switch (status) {
    case 'working': return 'Opérationnel';
    case 'faulty': return 'Panne';
    case 'maintenance': return 'En réparation';
    default: return status;
  }
}

function fmtDate(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
}

export function exportLinesPdf(lines: Line[], subsidiaries: Subsidiary[], fileName = 'lignes_par_filiale.pdf') {
  const groups = subsidiaries.map(s => ({ subsidiary: s, rows: lines.filter(l => l.subsidiaryId === s.id) }))
    .filter(g => g.rows.length > 0);

  // If no groups (no subsidiaries found), group all lines together
  if (groups.length === 0 && lines.length > 0) {
    groups.push({ subsidiary: { id: 'all', name: 'Toutes les lignes' }, rows: lines });
  }

  const doc = new jsPDF('p', 'mm', 'a4');  
  const pageWidth = doc.internal.pageSize.getWidth();

  groups.forEach((g, idx) => {
    if (idx > 0) doc.addPage();

    // Header: subsidiary name and timestamp
    const now = new Date();
    doc.setFontSize(15);
    doc.setFont('Times New Roman', 'bold');
    doc.text('Republique Algérienne Démocratique et Populaire', pageWidth / 2, 16,{
             align: 'center',
        });
    doc.line(50, 16, 165, 16, 'f'); // decorative triangle
    doc.text('Wilaya de Sétif', 14, 26);
    doc.text('Direction des Transmissions Nationales', 14, 34);
    doc.text('Service Exploitation', 14, 44);
    doc.setFontSize(18);
    doc.setFont('Arial', 'bold');
    doc.text('Annuaire des Lignes Téléphoniques', pageWidth / 2, 66, { align: 'center' });
    doc.line(50, 66, 160, 66, 'f'); // decorative triangle
    doc.setFont('Default', 'normal');
    doc.setFontSize(14);
    doc.text(`${g.subsidiary.name}`, 14, 76);
    doc.setFontSize(9);
    doc.text(`Exporté le ${now.toLocaleString()}`, 14, 85);

    const head = [['Numéro', 'Type', 'Localisation', 'État', 'Date établissement', 'Incluse dans flux pannes', 'Dernier contrôle']];
    const body = g.rows.map(l => [
      l.number,
      l.type,
      l.location,
      statusLabel(l.status),
      fmtDate(l.establishmentDate),
      l.inFaultFlow ? 'Oui' : 'Non',
      fmtDate(l.lastChecked)
    ]);

    autoTable(doc, {
      startY: 96,
      head,
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [240, 240, 240] },
      margin: { left: 14, right: 14 }
    });

    // Footer with page number (simple)
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.text(`Page ${idx + 1} / ${groups.length}`, 14, 287);
  });

  doc.save(fileName);
}

export function exportLinesXlsx(lines: Line[], subsidiaries: Subsidiary[], fileName = 'lignes_par_filiale.xlsx') {
  const wb = XLSX.utils.book_new();

  const groups = subsidiaries.map(s => ({ subsidiary: s, rows: lines.filter(l => l.subsidiaryId === s.id) }))
    .filter(g => g.rows.length > 0);

  if (groups.length === 0 && lines.length > 0) {
    groups.push({ subsidiary: { id: 'all', name: 'Toutes les lignes' }, rows: lines });
  }

  groups.forEach((g) => {
    const aoa = [
      ['Numéro', 'Type', 'Localisation', 'État', 'Date établissement', 'Incluse dans flux pannes', 'Dernier contrôle'] as string[],
      ...(g.rows.map(l => [
        l.number,
        l.type,
        l.location,
        statusLabel(l.status),
        fmtDate(l.establishmentDate),
        l.inFaultFlow ? 'Oui' : 'Non',
        fmtDate(l.lastChecked)
      ] as string[]))
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Excel sheet names max length is 31
    const sheetName = g.subsidiary.name.slice(0, 31);

    // Add a small header row with export timestamp
    const now = new Date().toLocaleString();
    XLSX.utils.sheet_add_aoa(ws, [[`Exporté le ${now}`]], { origin: 'A1' });
    // Shift data down by 2 rows so timestamp is visible
    XLSX.utils.sheet_add_aoa(ws, aoa, { origin: 'A3' });

    XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Feuille');
  });

  XLSX.writeFile(wb, fileName);
}
