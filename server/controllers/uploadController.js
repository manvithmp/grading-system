import fs from 'fs';
import Student from '../models/Student.js';
import Upload from '../models/UploadHistory.js';
import { processAnyFile } from '../utils/fileProcessor.js';

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file' });
    }

    const { path: filePath, originalname, mimetype, size, filename } = req.file;

    // Parse file robustly (supports row-oriented and single-column stacked)
    const docs = processAnyFile(filePath, mimetype, originalname);

    // Upsert by student_id to avoid duplicate key errors and allow re-uploads
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
      upserted =
        (result?.upsertedCount ?? 0) +
        // when an existing doc is updated, modifiedCount increases
        (result?.modifiedCount ?? 0);
    }

    await Upload.create({
      filename,
      originalName: originalname,
      fileSize: size,
      mimeType: mimetype,
      recordsCount: docs.length,
      successfulRecords: upserted,
      failedRecords: Math.max(0, docs.length - upserted),
      status: 'completed'
    });

    // cleanup
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}

    return res.json({
      success: true,
      total: docs.length,
      upserted
    });
  } catch (err) {
    // cleanup
    try {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch {}
    next(err);
  }
};
