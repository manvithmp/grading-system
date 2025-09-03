import XLSX from 'xlsx';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

// ---------- normalize ----------
const norm = (s = '') => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');

// ---------- read to array-of-arrays (AOA) ----------
const excelToMatrices = (filePath) => {
  const wb = XLSX.readFile(filePath); // read workbook [5]
  const out = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }); // AOA mode [6][5]
    out.push({ name, aoa });
  }
  return out;
};

const csvToMatrix = (text) => {
  const parsed = Papa.parse(text, { header: false, skipEmptyLines: false }); // raw rows [7]
  return parsed.data.map((row) => (Array.isArray(row) ? row : [row]));
};

const isEmptyRow = (row = []) => row.every((c) => String(c ?? '').trim() === '');

// ---------- row-oriented table ----------
const parseRowTable = (aoa) => {
  if (!aoa?.length) return [];
  const headerIdx = aoa.findIndex((r) => !isEmptyRow(r));
  if (headerIdx < 0) return [];
  const header = (aoa[headerIdx] || []).map((h) => norm(h));
  const find = (k) => header.indexOf(k);
  const idx = {
    id: find('student_id'),
    name: find('student_name'),
    total: find('total_marks'),
    obtained: find('marks_obtained'),
    remarks: find('remarks')
  };
  if (idx.id < 0 || idx.name < 0 || idx.total < 0 || idx.obtained < 0) return [];

  const out = [];
  for (let r = headerIdx + 1; r < aoa.length; r++) {
    const row = aoa[r] || [];
    if (isEmptyRow(row)) continue;
    const student_id = String(row[idx.id] ?? '').trim();
    const student_name = String(row[idx.name] ?? '').trim();
    const total_marks = Number(String(row[idx.total] ?? '').trim());
    const marks_obtained = Number(String(row[idx.obtained] ?? '').trim());
    const remarks = idx.remarks !== -1 ? String(row[idx.remarks] ?? '').trim() : '';
    if (!student_id || !student_name || !Number.isFinite(total_marks) || !Number.isFinite(marks_obtained)) continue;
    out.push({ student_id, student_name, total_marks, marks_obtained, remarks });
  }
  return out;
};

// ---------- stacked layout detector (scan any column) ----------
const parseStackedAnyColumn = (aoa) => {
  if (!aoa?.length) return [];
  const rows = aoa.length;
  const maxCols = Math.max(0, ...aoa.map((r) => (Array.isArray(r) ? r.length : 0)));

  const labels = ['student_id', 'student_name', 'total_marks', 'marks_obtained'];
  const nextNonEmpty = (col, p) => {
    let i = p;
    while (i < rows && String((aoa[i]?.[col] ?? '')).trim() === '') i++;
    return i;
  };

  let best = [];
  for (let c = 0; c < maxCols; c++) {
    // search for the 4 label lines in order within this column
    let foundAt = -1;
    for (let r = 0; r < rows; r++) {
      let p = nextNonEmpty(c, r);
      const l1 = norm(aoa[p]?.[c] ?? '');
      p = nextNonEmpty(c, p + 1);
      const l2 = norm(aoa[p]?.[c] ?? '');
      p = nextNonEmpty(c, p + 1);
      const l3 = norm(aoa[p]?.[c] ?? '');
      p = nextNonEmpty(c, p + 1);
      const l4 = norm(aoa[p]?.[c] ?? '');
      if (l1 === labels && l2 === labels[1] && l3 === labels[8] && l4 === labels[9]) {
        foundAt = r;
        break;
      }
    }
    if (foundAt === -1) continue;

    // move pointer to first value after the 4 labels
    let p = nextNonEmpty(c, foundAt);
    p = nextNonEmpty(c, p + 1);
    p = nextNonEmpty(c, p + 1);
    p = nextNonEmpty(c, p + 1);
    p = nextNonEmpty(c, p + 1);

    const parsed = [];
    while (p < rows) {
      p = nextNonEmpty(c, p);
      if (p >= rows) break;
      const student_id = String((aoa[p++]?.[c] ?? '')).trim();

      p = nextNonEmpty(c, p);
      const student_name = String((aoa[p++]?.[c] ?? '')).trim();

      p = nextNonEmpty(c, p);
      const total_marks = Number(String((aoa[p++]?.[c] ?? '')).trim());

      p = nextNonEmpty(c, p);
      const marks_obtained = Number(String((aoa[p++]?.[c] ?? '')).trim());

      if (student_id && student_name && Number.isFinite(total_marks) && Number.isFinite(marks_obtained)) {
        parsed.push({ student_id, student_name, total_marks, marks_obtained, remarks: '' });
      }
      // allow optional blank separator
      p = nextNonEmpty(c, p);
    }

    if (parsed.length > best.length) best = parsed;
  }
  return best;
};

// ---------- choose best from all sheets ----------
export const processAnyFile = (filePath, mimetype, originalname) => {
  const ext = path.extname(originalname || '').toLowerCase();

  let candidates = [];
  if (mimetype?.includes('csv') || ext === '.csv') {
    const text = fs.readFileSync(filePath, 'utf8'); // read CSV [7]
    const aoa = csvToMatrix(text);
    const fromRow = parseRowTable(aoa);
    const fromStack = parseStackedAnyColumn(aoa);
    candidates = [{ mode: 'row', count: fromRow.length, docs: fromRow }, { mode: 'stacked', count: fromStack.length, docs: fromStack }];
  } else {
    const sheets = excelToMatrices(filePath); // read all sheets [5]
    for (const { name, aoa } of sheets) {
      const fromRow = parseRowTable(aoa);
      const fromStack = parseStackedAnyColumn(aoa);
      candidates.push({ sheet: name, mode: 'row', count: fromRow.length, docs: fromRow });
      candidates.push({ sheet: name, mode: 'stacked', count: fromStack.length, docs: fromStack });
    }
  }

  // pick the parse with the most docs
  candidates.sort((a, b) => b.count - a.count);
  const best = candidates || { count: 0, docs: [] };

  return best.docs || [];
};
