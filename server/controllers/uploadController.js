import fs from 'fs';
import Student from '../models/Student.js';
import Upload from '../models/UploadHistory.js';
import { processAnyFile } from '../utils/fileProcessor.js';

export const uploadFile = async (req, res, next) => {
  const started = Date.now();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file' });

    const { path: filePath, originalname, mimetype, size, filename } = req.file;

    const docs = processAnyFile(filePath, mimetype, originalname);

    let upserted = 0;
    if (docs.length) {
      const ops = docs.map((s) => ({
        updateOne: {
          filter: { student_id: s.student_id },
          update: { $set: s },
          upsert: true
        }
      }));
      const result = await Student.bulkWrite(ops, { ordered: false });
      upserted = (result?.upsertedCount ?? 0) + (result?.modifiedCount ?? 0);
    }

    await Upload.create({
      filename,
      originalName: originalname,
      fileSize: size,
      mimeType: mimetype,
      recordsCount: docs.length,
      successfulRecords: upserted,
      failedRecords: Math.max(0, docs.length - upserted),
      status: 'completed',
      processingTime: Date.now() - started
    });

    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}

    return res.json({
      success: true,
      message: `Upserted ${upserted}/${docs.length}`,
      total: docs.length,
      upserted
    });
  } catch (err) {
    try { if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch {}
    next(err);
  }
};
