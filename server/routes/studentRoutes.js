import express from 'express';
import {getStudents,createStudent,updateStudent,deleteStudent} from '../controllers/studentController.js';
import {studentRules,validate,objectId} from '../middleware/validation.js';

const router=express.Router();
router.get('/',getStudents);
router.post('/',studentRules,validate,createStudent);
router.put('/:id',objectId,updateStudent);
router.delete('/:id',objectId,deleteStudent);

export default router;
