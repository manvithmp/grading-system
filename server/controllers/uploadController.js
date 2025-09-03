import fs from 'fs';
import Student from '../models/Student.js';
import Upload  from '../models/UploadHistory.js';
import { processAnyFile } from '../utils/fileProcessor.js';

export const uploadFile = async (req, res, next) => {
  const t0 = Date.now();
  try {
    if (!req.file)
      return res.status(400).json({ success:false, message:'No file' });

    const { path:fp, originalname, mimetype, size, filename } = req.file;
    const docs = processAnyFile(fp, mimetype, originalname);   // parsed rows

    /* bulk upsert */
    let upserted = 0;
    if (docs.length) {
      const ops = docs.map(d => ({
        updateOne: {
          filter : { student_id:d.student_id },
          update : { $set:d },
          upsert : true
        }
      }));
      const r = await Student.bulkWrite(ops, { ordered:false });
      upserted = (r.upsertedCount||0) + (r.modifiedCount||0);
    }

    await Upload.create({
      filename,
      originalName : originalname,
      fileSize     : size,
      mimeType     : mimetype,
      recordsCount : docs.length,
      successfulRecords: upserted,
      failedRecords    : docs.length - upserted,
      processingTime   : Date.now() - t0,
      status:'completed'
    });

    try { fs.existsSync(fp) && fs.unlinkSync(fp); } catch {}

    res.json({ success:true, message:`Upserted ${upserted}/${docs.length}`, total:docs.length });
  } catch (err) {
    try { fs.existsSync(req.file?.path) && fs.unlinkSync(req.file.path); } catch {}
    next(err);
  }
};
