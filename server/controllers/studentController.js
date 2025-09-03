import Student from '../models/Student.js';

export const getStudents = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const q = req.query.q?.trim() || '';

    let filter = {};
    if (q) {
      
      const sampleDocs = await Student.find({}).limit(50);
      const keysSet = new Set();
      sampleDocs.forEach(doc => {
        Object.keys(doc.toObject()).forEach(k => {
          if (!['_id', '__v', 'createdAt', 'updatedAt'].includes(k)) {
            keysSet.add(k);
          }
        });
      });
      const keys = Array.from(keysSet);
      if (keys.length > 0) {
        filter = {
          $or: keys.map(k => ({ [k]: { $regex: q, $options: 'i' } }))
        };
      } else {
        filter = {};
      }
    }

    const count = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ students, count, page, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};

export const createStudent = async (req, res) =>
  res.json(await Student.create(req.body));

export const updateStudent = async (req, res) =>
  res.json(await Student.findByIdAndUpdate(req.params.id, req.body, { new: true }));

export const deleteStudent = async (req, res) =>
  res.json(await Student.findByIdAndDelete(req.params.id));