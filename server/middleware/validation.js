import {body,param,validationResult} from 'express-validator';

export const studentRules=[
  body('student_id').notEmpty().isLength({max:20}),
  body('student_name').notEmpty().isLength({max:100}),
  body('total_marks').isNumeric(),
  body('marks_obtained').isNumeric(),
];

export const validate=(req,res,next)=>{
  const errors=validationResult(req);
  if(!errors.isEmpty()) return res.status(400).json({success:false,errors:errors.array()});
  next();
};

export const objectId=[param('id').isMongoId(),validate];
