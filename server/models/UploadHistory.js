import mongoose from 'mongoose';

const uploadSchema=new mongoose.Schema({
  filename:String,
  originalName:String,
  fileSize:Number,
  mimeType:String,
  recordsCount:Number,
  successfulRecords:Number,
  failedRecords:Number,
  status:{type:String,enum:['processing','completed','failed','partial'],default:'processing'},
  errors:Array,
  processingTime:Number
},{timestamps:true});

export default mongoose.model('UploadHistory',uploadSchema);
