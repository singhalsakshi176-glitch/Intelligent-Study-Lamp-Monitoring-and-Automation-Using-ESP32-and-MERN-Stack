const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const lampRoutes = require('./routes/lampRoutes');
const statsRoutes = require('./routes/statsRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for frontend applications
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Smart Study Lamp API',
    time: new Date().toISOString(),
    timezone: process.env.TIMEZONE || 'Asia/Kolkata',
  });
});

// API Routes
app.use('/api/lamp', lampRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/sessions', sessionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message,
  });
});

// Start server
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`💡 Smart Study Lamp API running on port ${PORT}`);
      console.log(`📡 Endpoints:`);
      console.log(`   - POST /api/lamp/on`);
      console.log(`   - POST /api/lamp/off`);
      console.log(`   - GET  /api/lamp/status/:deviceId`);
      console.log(`   - GET  /api/stats/today?deviceId=`);
      console.log(`   - GET  /api/stats/compare?deviceId=`);
      console.log(`   - GET  /api/stats/last7days?deviceId=`);
      console.log(`   - GET  /api/sessions?deviceId=&limit=10`);
      console.log(`   - GET  /api/health`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
