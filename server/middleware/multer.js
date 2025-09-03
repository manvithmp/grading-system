import multer from 'multer';
import path from 'path';
import fs from 'fs';

const dir = 'uploads';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

// Accept common Excel/CSV extensions + MIME variants
const allowedExt = new Set(['.csv', '.xlsx', '.xls']);
const allowedMime = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();
  if (allowedExt.has(ext) || allowedMime.has(mime)) return cb(null, true);
  cb(new Error('Invalid file type. Only .csv, .xlsx, .xls are allowed.'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});
