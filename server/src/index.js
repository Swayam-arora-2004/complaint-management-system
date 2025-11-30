const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware - CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'];

// Add Vercel preview URLs if in production
if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, check against allowed origins
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        callback(null, true);
      } else {
        // Allow Vercel preview deployments
        if (origin.includes('.vercel.app') || origin.includes('.railway.app')) {
          callback(null, true);
        } else {
          console.warn('Blocked origin:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      }
    } else {
      // In development, allow all
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Complaint Management API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Auth routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/auth', require('./routes/oauthRoutes'));

// Complaint routes (protected)
app.use('/api/complaints', require('./routes/complaintRoutes'));

// Admin routes (protected, support agent only)
app.use('/api/admin', require('./routes/adminRoutes'));

const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

