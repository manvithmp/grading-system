import XLSX from 'xlsx';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

// Normalize header/labels: lower, trim, non-alnum -> _
const norm = (s = '') => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');

// Read Excel first sheet to array-of-arrays (AOA)
const excelToMatrix = (filePath) => {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }); // AOA mode
};

// Read CSV to AOA
const csvToMatrix = (text) => {
  const out = Papa.parse(text, { header: false, skipEmptyLines: false });
  // force AOA shape
  return out.data.map((r) => (Array.isArray(r) ? r : [r]));
};

// Utility: check if entire row is empty after trimming
const isEmptyRow = (row = []) => row.every((c) => String(c ?? '').trim() === '');

// Try parse row-oriented table with header row across columns
const parseRowTable = (matrix) => {
  if (!matrix?.length) return [];
  const headerRowIdx = matrix.findIndex((r) => !isEmptyRow(r));
  if (headerRowIdx < 0) return [];

  const header = (matrix[headerRowIdx] || []).map((h) => norm(h));
  const getIdx = (k) => header.indexOf(k);
  const idx = {
    id: getIdx('student_id'),
    name: getIdx('student_name'),
    total: getIdx('total_marks'),
    obtained: getIdx('marks_obtained'),
    remarks: getIdx('remarks')
  };
  if (idx.id === -1 || idx.name === -1 || idx.total === -1 || idx.obtained === -1) return [];

  const rows = [];
  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    if (isEmptyRow(row)) continue;
    const student_id = String(row[idx.id] ?? '').trim();
    const student_name = String(row[idx.name] ?? '').trim();
    const total_marks = Number(String(row[idx.total] ?? '').trim());
    const marks_obtained = Number(String(row[idx.obtained] ?? '').trim());
    const remarks = idx.remarks !== -1 ? String(row[idx.remarks] ?? '').trim() : '';
    if (!student_id || !student_name || !Number.isFinite(total_marks) || !Number.isFinite(marks_obtained)) continue;
    rows.push({ student_id, student_name, total_marks, marks_obtained, remarks });
  }
  return rows;
};

// Parse single-column stacked layout anywhere in Col A with optional blank separators
const parseStackedColumn = (matrix) => {
  // collapse to first column, trimming but keep empty lines as '' to separate records
  const col = (matrix || []).map((r) => String((Array.isArray(r) ? r : r) ?? '').trim());

  // find the first place where the next 4 non-empty lines are the required labels in order
  const labelsWanted = ['student_id', 'student_name', 'total_marks', 'marks_obtained'];
  const nextNonEmpty = (i) => {
    let j = i;
    while (j < col.length && col[j] === '') j++;
    return j;
  };

  let start = -1;
  for (let i = 0; i < col.length; i++) {
    let j = nextNonEmpty(i);
    const l1 = norm(col[j] || '');
    j = nextNonEmpty(j + 1);
    const l2 = norm(col[j] || '');
    j = nextNonEmpty(j + 1);
    const l3 = norm(col[j] || '');
    j = nextNonEmpty(j + 1);
    const l4 = norm(col[j] || '');
    if (l1 === labelsWanted && l2 === labelsWanted[11] && l3 === labelsWanted[12] && l4 === labelsWanted[13]) {
      start = i;
      break;
    }
  }
  if (start === -1) return [];

  // move pointer to first value line after the 4 labels
  let p = nextNonEmpty(start);
  p = nextNonEmpty(p + 1);
  p = nextNonEmpty(p + 1);
  p = nextNonEmpty(p + 1);
  p = nextNonEmpty(p + 1);

  const out = [];
  while (p < col.length) {
    // skip separators
    p = nextNonEmpty(p);
    if (p >= col.length) break;

    const student_id = String(col[p++] ?? '').trim();
    p = nextNonEmpty(p);
    const student_name = String(col[p++] ?? '').trim();
    p = nextNonEmpty(p);
    const total_marks = Number(String(col[p++] ?? '').trim());
    p = nextNonEmpty(p);
    const marks_obtained = Number(String(col[p++] ?? '').trim());

    if (student_id && student_name && Number.isFinite(total_marks) && Number.isFinite(marks_obtained)) {
      out.push({ student_id, student_name, total_marks, marks_obtained, remarks: '' });
    }

    // allow one optional blank separator
    p = nextNonEmpty(p);
  }
  return out;
};

export const processAnyFile = (filePath, mimetype, originalname) => {
  const ext = path.extname(originalname || '').toLowerCase();
  let matrix = [];
  if (mimetype?.includes('csv') || ext === '.csv') {
    const text = fs.readFileSync(filePath, 'utf8');
    matrix = csvToMatrix(text);
  } else {
    matrix = excelToMatrix(filePath);
  }

  // Heuristic: if many rows have width > 1, try row-table first
  const widths = matrix.map((r) => (Array.isArray(r) ? r.filter((c) => String(c).trim() !== '').length : 0));
  const multiCellRows = widths.filter((w) => w >= 3).length;
  let docs = [];
  if (multiCellRows >= Math.ceil(matrix.length * 0.2)) {
    docs = parseRowTable(matrix);
    if (!docs.length) docs = parseStackedColumn(matrix);
  } else {
    docs = parseStackedColumn(matrix);
    if (!docs.length) docs = parseRowTable(matrix);
  }

  return docs;
};
