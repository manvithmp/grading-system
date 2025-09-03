import express from 'express';
import { upload } from '../middleware/multer.js';
import { uploadFile } from '../controllers/uploadController.js';

const router = express.Router();

// Field name must be 'file' to match the frontend FormData key
router.post('/', upload.single('file'), uploadFile);

export default router;
