const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_saucedemo_jwt_token_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token otorisasi tidak ditemukan.'
    });
  }

  // Format: Bearer <token>
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      success: false,
      message: 'Format token tidak valid. Gunakan format: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Sesi telah berakhir atau token tidak valid. Silakan login kembali.'
    });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};
