import express  from 'express';
import cors     from 'cors';
import helmet   from 'helmet';
import morgan   from 'morgan';
import dotenv   from 'dotenv';
import compression from 'compression';
import rateLimit   from 'express-rate-limit';

import connectDB      from './config/database.js';
import studentRoutes  from './routes/studentRoutes.js';
import uploadRoutes   from './routes/uploadRoutes.js';
import errorHandler   from './middleware/errorHandler.js';

dotenv.config();
connectDB();

const app  = express();
const PORT = process.env.PORT || 5000;

/* ───── global middleware ───── */
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
app.use(compression());
app.use(morgan('dev'));
app.use(cors({origin:process.env.FRONTEND_URL?.split(',') || '*'}));
app.use(express.json({limit:'10mb'}));
app.use(express.urlencoded({extended:true,limit:'10mb'}));
app.use('/uploads',express.static('uploads'));

/* ───── rate limit ───── */
app.use('/api',rateLimit({windowMs:15*60*1000,max:200}));

/* ───── routes ───── */
app.get('/api/health',(req,res)=>res.json({ok:true,timestamp:Date.now()}));
app.use('/api/students',studentRoutes);
app.use('/api/upload',  uploadRoutes);

/* ───── error handling ───── */
app.use((req, res) => {
  res.status(404).json({ success:false, message:'Route not found' });
});
app.use(errorHandler);

app.listen(PORT,()=>console.log(`Backend 🟢  http://localhost:${PORT}`));
