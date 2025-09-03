import mongoose from 'mongoose';

const studentSchema=new mongoose.Schema({
  student_id:{type:String,required:true,unique:true,trim:true,maxlength:20},
  student_name:{type:String,required:true,trim:true,maxlength:100},
  total_marks:{type:Number,required:true,min:0,max:1000},
  marks_obtained:{type:Number,required:true,min:0},
  percentage:{type:Number},
  grade:{type:String},
  remarks:{type:String,trim:true,maxlength:200}
},{timestamps:true});

studentSchema.pre('save',function(next){
  this.percentage=Math.round((this.marks_obtained/this.total_marks)*100*100)/100;
  const p=this.percentage;
  this.grade= p>=95?'A+': p>=90?'A': p>=85?'B+': p>=80?'B': p>=75?'C+': p>=70?'C': p>=60?'D':'F';
  next();
});

export default mongoose.model('Student',studentSchema);
