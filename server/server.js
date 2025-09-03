import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import connectDB from './config/database.js';
import studentRoutes from './routes/studentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

/* ----------  CORS  ---------- */
const allowedOrigins = [
  'http://localhost:5173',                  // Vite dev server
  'https://grading-system-pi-seven.vercel.app' // Deployed front-end
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// (Optional) handle pre-flight requests for every route
app.options('*', cors({ origin: allowedOrigins, credentials: true }));

/* ----------  Security & Compression  ---------- */
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

/* ----------  Logging & Parsing  ---------- */
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ----------  Static & Rate-limit  ---------- */
app.use('/uploads', express.static('uploads'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

/* ----------  Routes  ---------- */
app.get('/api/health', (req, res) =>
  res.json({ ok: true, timestamp: Date.now() })
);
app.use('/api/students', studentRoutes);
app.use('/api/upload', uploadRoutes);

/* ----------  404 & Error Handler  ---------- */
app.use((req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);
app.use(errorHandler);

/* ----------  Start Server  ---------- */
app.listen(PORT, () =>
  console.log(`Backend 🟢  http://localhost:${PORT}`)
);
