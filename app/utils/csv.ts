// Semicolon separator and a BOM: the file opens with the right columns and accents in Excel (pt locale).
export function toCsv(header: string[], rows: (string | number | null)[][]): string {
  const escape = (value: string | number | null) => {
    const text = value === null ? '' : String(value);

    return /[";\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };

  return `﻿${[header, ...rows].map(row => row.map(escape).join(';')).join('\r\n')}\r\n`;
}

export function downloadTextFile(name: string, content: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');

  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
