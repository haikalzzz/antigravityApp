const { getPool } = require('../config/db');

// Helper untuk format tanggal YYYY-MM-DD
function formatDate(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper validasi input biodata
function validateBiodataInput(body) {
  let { nama_lengkap, alamat, tanggal_lahir, nomor_telepon, jenis_kelamin, jurusan, bahasa } = body;

  // Normalisasi bahasa (jika array, gabungkan jadi string)
  let normalizedBahasa = '';
  if (Array.isArray(bahasa)) {
    normalizedBahasa = bahasa.filter(b => b && b.trim() !== '').join(', ');
  } else if (typeof bahasa === 'string') {
    normalizedBahasa = bahasa.trim();
  }

  // Cek apakah ada data yang tidak diisi
  if (
    !nama_lengkap || !nama_lengkap.trim() ||
    !alamat || !alamat.trim() ||
    !tanggal_lahir || !String(tanggal_lahir).trim() ||
    !nomor_telepon || !String(nomor_telepon).trim() ||
    !jenis_kelamin || !jenis_kelamin.trim() ||
    !jurusan || !jurusan.trim() ||
    !normalizedBahasa
  ) {
    return {
      isValid: false,
      message: 'data harus diisi'
    };
  }

  nama_lengkap = nama_lengkap.trim();
  alamat = alamat.trim();
  tanggal_lahir = String(tanggal_lahir).trim();
  nomor_telepon = String(nomor_telepon).trim();
  jenis_kelamin = jenis_kelamin.trim();
  jurusan = jurusan.trim();

  // Validasi panjang karakter
  if (nama_lengkap.length > 50) {
    return { isValid: false, message: 'Nama lengkap maksimal 50 karakter.' };
  }
  if (alamat.length > 100) {
    return { isValid: false, message: 'Alamat maksimal 100 karakter.' };
  }

  // Pastikan nomor telepon berawalan +62
  if (!nomor_telepon.startsWith('+62')) {
    nomor_telepon = '+62' + nomor_telepon.replace(/^\+?62|^0/, '');
  }
  if (nomor_telepon.length > 15) {
    return { isValid: false, message: 'Nomor telepon maksimal 15 karakter (termasuk +62).' };
  }

  return {
    isValid: true,
    data: {
      nama_lengkap,
      alamat,
      tanggal_lahir,
      nomor_telepon,
      jenis_kelamin,
      jurusan,
      bahasa: normalizedBahasa
    }
  };
}

// GET /api/biodata - Ambil data dengan pagination
async function getAllBiodata(req, res) {
  try {
    const pool = getPool();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const offset = (page - 1) * limit;

    // Hitung total data
    const [countResult] = await pool.query('SELECT COUNT(*) AS total FROM `biodata`');
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit) || 1;

    // Ambil data sesuai page & limit
    const [rows] = await pool.query(
      'SELECT id, nama_lengkap, alamat, DATE_FORMAT(tanggal_lahir, "%Y-%m-%d") AS tanggal_lahir, nomor_telepon, jenis_kelamin, jurusan, bahasa, created_at, updated_at FROM `biodata` ORDER BY id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching biodata:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data biodata.'
    });
  }
}

// GET /api/biodata/:id - Ambil satu data biodata
async function getBiodataById(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [rows] = await pool.query(
      'SELECT id, nama_lengkap, alamat, DATE_FORMAT(tanggal_lahir, "%Y-%m-%d") AS tanggal_lahir, nomor_telepon, jenis_kelamin, jurusan, bahasa, created_at, updated_at FROM `biodata` WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data biodata tidak ditemukan.'
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching biodata by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail biodata.'
    });
  }
}

// POST /api/biodata - Simpan data biodata baru
async function createBiodata(req, res) {
  try {
    const validation = validateBiodataInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { nama_lengkap, alamat, tanggal_lahir, nomor_telepon, jenis_kelamin, jurusan, bahasa } = validation.data;
    const pool = getPool();

    const [result] = await pool.query(
      'INSERT INTO `biodata` (nama_lengkap, alamat, tanggal_lahir, nomor_telepon, jenis_kelamin, jurusan, bahasa) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nama_lengkap, alamat, tanggal_lahir, nomor_telepon, jenis_kelamin, jurusan, bahasa]
    );

    return res.status(201).json({
      success: true,
      message: 'Data biodata berhasil disimpan!',
      data: {
        id: result.insertId,
        nama_lengkap,
        alamat,
        tanggal_lahir,
        nomor_telepon,
        jenis_kelamin,
        jurusan,
        bahasa
      }
    });
  } catch (error) {
    console.error('Error saving biodata:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan data biodata ke database.'
    });
  }
}

// PUT /api/biodata/:id - Edit / update data biodata
async function updateBiodata(req, res) {
  try {
    const { id } = req.params;
    const validation = validateBiodataInput(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const pool = getPool();
    // Cek apakah data ada
    const [existing] = await pool.query('SELECT id FROM `biodata` WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data biodata tidak ditemukan.'
      });
    }

    const { nama_lengkap, alamat, tanggal_lahir, nomor_telepon, jenis_kelamin, jurusan, bahasa } = validation.data;

    await pool.query(
      'UPDATE `biodata` SET nama_lengkap = ?, alamat = ?, tanggal_lahir = ?, nomor_telepon = ?, jenis_kelamin = ?, jurusan = ?, bahasa = ? WHERE id = ?',
      [nama_lengkap, alamat, tanggal_lahir, nomor_telepon, jenis_kelamin, jurusan, bahasa, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Data biodata berhasil diperbarui!',
      data: {
        id: parseInt(id, 10),
        nama_lengkap,
        alamat,
        tanggal_lahir,
        nomor_telepon,
        jenis_kelamin,
        jurusan,
        bahasa
      }
    });
  } catch (error) {
    console.error('Error updating biodata:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data biodata.'
    });
  }
}

// DELETE /api/biodata/:id - Hapus data biodata
async function deleteBiodata(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [existing] = await pool.query('SELECT id FROM `biodata` WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data biodata tidak ditemukan.'
      });
    }

    await pool.query('DELETE FROM `biodata` WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Data biodata berhasil dihapus!'
    });
  } catch (error) {
    console.error('Error deleting biodata:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus data biodata.'
    });
  }
}

module.exports = {
  getAllBiodata,
  getBiodataById,
  createBiodata,
  updateBiodata,
  deleteBiodata
};
