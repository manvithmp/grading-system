import express from 'express';
import { upload } from '../middleware/multer.js';
import { uploadFile } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/', upload.single('file'), uploadFile);

export default router;
