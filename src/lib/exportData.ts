import * as XLSX from 'xlsx';
import { Task } from './TasksContext';

function buildTimestamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tasksToRows(tasks: Task[]): Record<string, string>[] {
  return tasks.map(t => ({
    'ID': t.id,
    'Título': t.name,
    'Descrição': t.description ?? '',
    'Status': t.status,
    'Prioridade': t.priority,
    'Grupo': t.group,
    'Responsável': t.assignee,
    'Tags': (t.tags ?? []).join(', '),
    'Data de Entrega': t.due_date ?? '',
    'Criado em': t.created_at ?? '',
  }));
}

export function exportToCSV(tasks: Task[], filename?: string): void {
  const rows = tasksToRows(tasks);
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row =>
      headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(',')
    ),
  ];

  const csvContent = '﻿' + csvLines.join('\r\n'); // BOM for Excel UTF-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? `easytask_tarefas_${buildTimestamp()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(tasks: Task[], filename?: string): void {
  const rows = tasksToRows(tasks);
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  const wsData: any[][] = [
    headers,
    ...rows.map(row => headers.map(h => row[h])),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Bold header row
  headers.forEach((_, col) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = { font: { bold: true } };
    }
  });

  // Auto column widths
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length, 14) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tarefas');
  XLSX.writeFile(wb, filename ?? `easytask_tarefas_${buildTimestamp()}.xlsx`);
}
