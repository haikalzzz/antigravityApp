const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi!'
      });
    }

    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM `users` WHERE `username` = ? LIMIT 1',
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah!'
      });
    }

    const user = rows[0];
    let isPasswordMatch = false;

    // Periksa apakah hash bcrypt atau plain text (untuk kemudahan jika ditambahkan manual di DBeaver)
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isPasswordMatch = await bcrypt.compare(password, user.password);
    } else {
      isPasswordMatch = (user.password === password);
    }

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah!'
      });
    }

    // Generate Bearer JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      token: token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat proses login.'
    });
  }
}

async function logout(req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logout berhasil. Sesi telah diakhiri.'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat proses logout.'
    });
  }
}

async function verifyToken(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user
  });
}

module.exports = {
  login,
  verifyToken,
  logout
};

