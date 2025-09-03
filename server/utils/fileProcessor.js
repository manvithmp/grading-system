import XLSX from 'xlsx';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

const norm = s => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
const isEmpty = row => row.length === 0;                 // ←  fix #2

/* ---------- helpers to read ---------- */
const readCsv = file =>
  Papa.parse(fs.readFileSync(file, 'utf8'), { header:false, skipEmptyLines:false })
      .data.map(r => (Array.isArray(r) ? r : [r]));

const readExcelSheets = file => {
  const wb = XLSX.readFile(file);
  return wb.SheetNames.map(name => ({
    name,
    aoa: XLSX.utils.sheet_to_json(                     // ←  fix #1
            wb.Sheets[name],
            { header:1, defval:'', raw:false }
         )
  }));
};

/* ---------- parse row-oriented table ---------- */
const parseRowTable = aoa => {
  const headIdx = aoa.findIndex(r => !isEmpty(r));
  if (headIdx < 0) return [];

  const head = aoa[headIdx].map(norm);
  const idx = k => head.indexOf(k);
  const col = {
    id  : idx('student_id'),
    name: idx('student_name'),
    tot : idx('total_marks'),
    obt : idx('marks_obtained'),
    rem : idx('remarks')
  };
  if (Object.values(col).some(i => i === -1)) return [];

  const out = [];
  for (let r = headIdx + 1; r < aoa.length; ++r) {
    const row = aoa[r] || [];
    if (isEmpty(row)) continue;
    const doc = {
      student_id     : String(row[col.id]   ?? '').trim(),
      student_name   : String(row[col.name] ?? '').trim(),
      total_marks    : Number(row[col.tot]),
      marks_obtained : Number(row[col.obt]),
      remarks        : col.rem !== -1 ? String(row[col.rem] ?? '').trim() : ''
    };
    if (doc.student_id && doc.student_name && Number.isFinite(doc.total_marks) && Number.isFinite(doc.marks_obtained))
      out.push(doc);
  }
  return out;
};

/* ---------- parse stacked 4-line blocks in ANY column ---------- */
const parseStacked = aoa => {
  const rows = aoa.length;
  const maxC = Math.max(0, ...aoa.map(r => r.length));
  const lbl  = ['student_id','student_name','total_marks','marks_obtained'];
  const next = (c,i) => { while (i<rows && String((aoa[i]?.[c]??'')).trim()==='') ++i; return i; };

  let best = [];
  for (let c = 0; c < maxC; ++c) {
    /* locate label sequence */
    let base = -1;
    for (let r = 0; r < rows; ++r) {
      let p = next(c,r);
      if (lbl.every((l,k)=> norm(aoa[next(c,p+k)]?.[c]??'') === l)) { base = p; break; }
    }
    if (base === -1) continue;

    /* parse records */
    let p = base + 4;
    const cur = [];
    while (p < rows) {
      p = next(c,p); if (p>=rows) break;
      const id   = String(aoa[p++]?.[c]??'').trim();
      p = next(c,p); const nm = String(aoa[p++]?.[c]??'').trim();
      p = next(c,p); const tot = Number(aoa[p++]?.[c]);
      p = next(c,p); const obt = Number(aoa[p++]?.[c]);
      if (id && nm && Number.isFinite(tot) && Number.isFinite(obt))
        cur.push({ student_id:id, student_name:nm, total_marks:tot, marks_obtained:obt, remarks:'' });
      p = next(c,p);          // skip optional blank line
    }
    if (cur.length > best.length) best = cur;
  }
  return best;
};

/* ---------- master extractor ---------- */
export const processAnyFile = (file, mime, name) => {
  const isCsv = mime?.includes('csv') || path.extname(name).toLowerCase() === '.csv';

  const matrices = isCsv
    ? [{ aoa: readCsv(file) }]
    : readExcelSheets(file);

  let best = [];
  for (const { aoa } of matrices) {
    const row = parseRowTable(aoa);
    const stk = parseStacked(aoa);
    const pick = row.length >= stk.length ? row : stk;
    if (pick.length > best.length) best = pick;
  }
  return best;
};
