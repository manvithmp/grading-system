import XLSX from 'xlsx';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

const isEmpty = row => row.length === 0 || row.every(cell => String(cell).trim() === '');

const readCsv = file =>
  Papa.parse(fs.readFileSync(file, 'utf8'), { header: false, skipEmptyLines: false })
    .data.map(r => (Array.isArray(r) ? r : [r]));

const readExcelSheets = file => {
  const wb = XLSX.readFile(file);
  return wb.SheetNames.map(name => ({
    name,
    aoa: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '', raw: false })
  }));
};


export const processAnyFile = (file, mime, name) => {
  const isCsv = mime?.includes('csv') || path.extname(name).toLowerCase() === '.csv';
  const matrices = isCsv ? [{ aoa: readCsv(file) }] : readExcelSheets(file);

  let best = [];
  for (const { aoa } of matrices) {
    if (aoa.length < 2) continue;
    const headers = aoa[0].map(h => String(h).trim());
    for (let r = 1; r < aoa.length; ++r) {
      const row = aoa[r];
      if (isEmpty(row)) continue;
      const doc = {};
      headers.forEach((h, i) => {
        doc[h] = row[i];
      });
      best.push(doc);
    }
  }
  return best;
};