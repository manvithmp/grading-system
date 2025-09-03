import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

export default mongoose.model('Student', studentSchema);