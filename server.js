const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const biodataRoutes = require('./src/routes/biodataRoutes');
const authController = require('./src/controllers/authController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// API Login & Logout langsung dan modular (/api/auth/*)
app.post('/api/login', authController.login);
app.post('/api/logout', authController.logout);
app.use('/api/auth', authRoutes);
app.use('/api/biodata', biodataRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server Express berjalan normal',
    timestamp: new Date()
  });
});

// Fallback untuk route selain API
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Endpoint tidak ditemukan' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal pada server.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server dengan inisialisasi Database
async function startServer() {
  try {
    console.log('Menghubungkan ke database MySQL...');
    await initDatabase();
    console.log('Database terhubung & tabel berhasil disiapkan.');

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 Aplikasi berjalan di: http://localhost:${PORT}`);
      console.log(`📡 API Login: POST http://localhost:${PORT}/api/login`);
      console.log(`📋 API Biodata: http://localhost:${PORT}/api/biodata`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.warn(`[PERINGATAN] Gagal terhubung ke MySQL: ${error.message}`);
    console.log('Server tetap dijalankan agar Anda dapat melihat tampilan frontend dan status koneksi.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT} (Menunggu koneksi MySQL/Docker siap)`);
    });
  }
}

startServer();
