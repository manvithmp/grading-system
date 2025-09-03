import XLSX from 'xlsx';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

// ---------- helpers ----------
const norm = (s = '') =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');

const REQUIRED = ['student_id', 'student_name', 'total_marks', 'marks_obtained'];

const isEmptyRow = (row = []) =>
  row.every((cell) => String(cell ?? '').trim() === '');

// Convert CSV text to a 2D matrix (array of arrays), no headers
const csvToMatrix = (text) => {
  const parsed = Papa.parse(text, {
    header: false,
    skipEmptyLines: 'greedy'
  });
  return parsed.data.map((row) =>
    Array.isArray(row) ? row : [row]
  );
};

// Read Excel first sheet to matrix (array of arrays)
const excelToMatrix = (filePath) => {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames];
  // header:1 gives array-of-arrays, defval to keep blanks
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
};

// Try to parse a normal row-oriented table (headers across the first row)
const parseRowOriented = (matrix) => {
  if (!matrix || matrix.length === 0) return [];

  // find the first non-empty row as header
  let headerRowIdx = matrix.findIndex((r) => !isEmptyRow(r));
  if (headerRowIdx < 0) return [];

  const headerRow = matrix[headerRowIdx].map((h) => norm(h));
  const idx = {
    student_id: headerRow.indexOf('student_id'),
    student_name: headerRow.indexOf('student_name'),
    total_marks: headerRow.indexOf('total_marks'),
    marks_obtained: headerRow.indexOf('marks_obtained'),
    remarks: headerRow.indexOf('remarks')
  };

  // ensure required columns exist
  if (REQUIRED.some((k) => idx[k] === -1)) return [];

  const out = [];
  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    if (isEmptyRow(row)) continue;

    const student_id = String(row[idx.student_id] ?? '').trim();
    const student_name = String(row[idx.student_name] ?? '').trim();
    const total_marks = Number(row[idx.total_marks] ?? 0);
    const marks_obtained = Number(row[idx.marks_obtained] ?? 0);
    const remarks =
      idx.remarks !== -1 ? String(row[idx.remarks] ?? '').trim() : '';

    if (!student_id || !student_name) continue;

    out.push({
      student_id,
      student_name,
      total_marks,
      marks_obtained,
      remarks
    });
  }
  return out;
};

// Parse a single-column “stacked” sheet:
// [Student_ID, Student_Name, Total_Marks, Marks_Obtained, S001, Lisa..., 100, 57, (blank), S002, ...]
const parseSingleColumnStacked = (matrix) => {
  // flatten to a single column of trimmed lines
  const col = [];
  for (const r of matrix) {
    const v = String((Array.isArray(r) ? r : r) ?? '').trim();
    // keep blank separators as '' to help chunking
    col.push(v);
  }

  // Remove leading blanks
  while (col.length && col === '') col.shift();

  // Expect first 4 lines to be the label names (any case/spacing)
  const labels = col.slice(0, 4).map(norm);
  const isHeaderOK =
    labels.length === 4 &&
    labels === 'student_id' &&
    labels[4] === 'student_name' &&
    labels[5] === 'total_marks' &&
    labels[6] === 'marks_obtained';
  if (!isHeaderOK) return [];

  // After the first 4 labels, consume values in chunks of 4, skipping blanks
  const vals = col.slice(4).filter((v) => v !== '' || v === '');
  const out = [];
  let i = 0;
  while (i < vals.length) {
    // skip any blank lines between records
    while (i < vals.length && vals[i] === '') i++;
    if (i >= vals.length) break;

    const student_id = String(vals[i++] ?? '').trim();
    if (!student_id) break;

    const student_name = String(vals[i++] ?? '').trim();
    const total_marks = Number(String(vals[i++] ?? '').trim());
    const marks_obtained = Number(String(vals[i++] ?? '').trim());

    out.push({
      student_id,
      student_name,
      total_marks,
      marks_obtained,
      remarks: ''
    });

    // optional blank separator after each record
    if (i < vals.length && vals[i] === '') i++;
  }
  return out;
};

// High-level extractor: auto-detect layout and return normalized student docs
const extractStudentsFromMatrix = (matrix) => {
  if (!matrix || matrix.length === 0) return [];

  // If any row has 3+ non-empty cells, assume normal row-oriented table
  const maxWidth = Math.max(
    0,
    ...matrix.map((r) => (Array.isArray(r) ? r.filter((c) => String(c).trim() !== '').length : 0))
  );

  let students = [];
  if (maxWidth >= 3) {
    students = parseRowOriented(matrix);
  } else {
    students = parseSingleColumnStacked(matrix);
  }

  // Final cleaning and validation
  const cleaned = students
    .map((s) => ({
      student_id: String(s.student_id ?? '').trim(),
      student_name: String(s.student_name ?? '').trim(),
      total_marks: Number(s.total_marks ?? 0),
      marks_obtained: Number(s.marks_obtained ?? 0),
      remarks: String(s.remarks ?? '').trim()
    }))
    .filter(
      (s) =>
        s.student_id &&
        s.student_name &&
        Number.isFinite(s.total_marks) &&
        Number.isFinite(s.marks_obtained)
    );

  return cleaned;
};

// Public API: process a file (Excel/CSV) and return student docs
export const processAnyFile = (filePath, mimetype, originalname) => {
  const ext = path.extname(originalname || '').toLowerCase();
  let matrix = [];

  try {
    if (mimetype?.includes('csv') || ext === '.csv') {
      const text = fs.readFileSync(filePath, 'utf8');
      matrix = csvToMatrix(text);
    } else {
      matrix = excelToMatrix(filePath);
    }
  } catch (e) {
    throw new Error('File read/parse error');
  }

  return extractStudentsFromMatrix(matrix);
};
