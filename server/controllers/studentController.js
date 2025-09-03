import Student from '../models/Student.js';

export const getStudents=async(req,res)=>{
  const page=Number(req.query.page)||1;
  const limit=Number(req.query.limit)||10;
  const q=req.query.q||'';
  const filter={ $or:[
      {student_id:{$regex:q,$options:'i'}},
      {student_name:{$regex:q,$options:'i'}}
  ]};
  const count=await Student.countDocuments(filter);
  const students=await Student.find(filter)
        .sort({createdAt:-1})
        .skip((page-1)*limit)
        .limit(limit);
  res.json({students,count,page,totalPages:Math.ceil(count/limit)});
};

export const createStudent=async(req,res)=>res.json(await Student.create(req.body));
export const updateStudent=async(req,res)=>res.json(await Student.findByIdAndUpdate(req.params.id,req.body,{new:true}));
export const deleteStudent=async(req,res)=>res.json(await Student.findByIdAndDelete(req.params.id));
