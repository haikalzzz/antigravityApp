const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'testapp_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool = null;
let isFallbackMode = false;

// In-Memory Storage untuk mode fallback (jika Docker/MySQL belum dijalankan)
let fallbackUsers = [];
let fallbackBiodata = [];
let autoIncBioId = 4;

async function initFallbackData() {
  const salt = await bcrypt.genSalt(10);
  const hashSauce = await bcrypt.hash('secret_sauce', salt);
  const hashAdmin = await bcrypt.hash('admin123', salt);

  fallbackUsers = [
    { id: 1, username: 'standard_user', password: hashSauce },
    { id: 2, username: 'admin', password: hashAdmin }
  ];

  fallbackBiodata = [
    {
      id: 1,
      nama_lengkap: 'Budi Santoso',
      alamat: 'Jl. Merdeka No. 45, Jakarta Pusat',
      tanggal_lahir: '1998-05-14',
      nomor_telepon: '+6281234567890',
      jenis_kelamin: 'Laki-laki',
      jurusan: 'Teknik Informatika',
      bahasa: 'Indonesia, Inggris',
      created_at: new Date()
    },
    {
      id: 2,
      nama_lengkap: 'Siti Rahmawati',
      alamat: 'Jl. Sudirman No. 88, Bandung',
      tanggal_lahir: '2000-09-21',
      nomor_telepon: '+6285678901234',
      jenis_kelamin: 'Perempuan',
      jurusan: 'Sistem Informasi',
      bahasa: 'Indonesia, Jepang',
      created_at: new Date()
    },
    {
      id: 3,
      nama_lengkap: 'Ahmad Fauzi',
      alamat: 'Jl. Diponegoro No. 12, Surabaya',
      tanggal_lahir: '1999-12-03',
      nomor_telepon: '+6287890123456',
      jenis_kelamin: 'Laki-laki',
      jurusan: 'Teknik Elektro',
      bahasa: 'Indonesia, Jerman',
      created_at: new Date()
    }
  ];
}

// Mock Pool untuk mengeksekusi query saat MySQL belum terhubung
const fallbackPool = {
  async query(sql, params = []) {
    const trimmed = sql.trim().toUpperCase();

    // SELECT user by username
    if (trimmed.startsWith('SELECT * FROM `USERS` WHERE `USERNAME` = ?')) {
      const username = params[0];
      const found = fallbackUsers.filter(u => u.username.toLowerCase() === username.toLowerCase());
      return [found];
    }

    // SELECT COUNT(*) from biodata
    if (trimmed.includes('COUNT(*) AS TOTAL FROM `BIODATA`')) {
      return [[{ total: fallbackBiodata.length }]];
    }

    // SELECT biodata list with pagination
    if (trimmed.startsWith('SELECT ID, NAMA_LENGKAP') && trimmed.includes('FROM `BIODATA` ORDER BY ID DESC LIMIT ? OFFSET ?')) {
      const limit = params[0];
      const offset = params[1];
      const sorted = [...fallbackBiodata].sort((a, b) => b.id - a.id);
      const paged = sorted.slice(offset, offset + limit);
      return [paged];
    }

    // SELECT single biodata by id
    if (trimmed.startsWith('SELECT ID, NAMA_LENGKAP') && trimmed.includes('WHERE ID = ?')) {
      const id = parseInt(params[0], 10);
      const found = fallbackBiodata.filter(b => b.id === id);
      return [found];
    }

    // INSERT INTO biodata
    if (trimmed.startsWith('INSERT INTO `BIODATA`')) {
      const newId = autoIncBioId++;
      const [nama_lengkap, alamat, tanggal_lahir, nomor_telepon, jenis_kelamin, jurusan, bahasa] = params;
      const record = {
        id: newId,
        nama_lengkap,
        alamat,
        tanggal_lahir,
        nomor_telepon,
        jenis_kelamin,
        jurusan,
        bahasa,
        created_at: new Date(),
        updated_at: new Date()
      };
      fallbackBiodata.push(record);
      return [{ insertId: newId, affectedRows: 1 }];
    }

    // UPDATE biodata
    if (trimmed.startsWith('UPDATE `BIODATA` SET')) {
      // params: [nama_lengkap, alamat, tanggal_lahir, nomor_telepon, jenis_kelamin, jurusan, bahasa, id]
      const id = parseInt(params[params.length - 1], 10);
      const index = fallbackBiodata.findIndex(b => b.id === id);
      if (index !== -1) {
        fallbackBiodata[index].nama_lengkap = params[0];
        fallbackBiodata[index].alamat = params[1];
        fallbackBiodata[index].tanggal_lahir = params[2];
        fallbackBiodata[index].nomor_telepon = params[3];
        fallbackBiodata[index].jenis_kelamin = params[4];
        fallbackBiodata[index].jurusan = params[5];
        fallbackBiodata[index].bahasa = params[6];
        fallbackBiodata[index].updated_at = new Date();
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }

    // DELETE from biodata
    if (trimmed.startsWith('DELETE FROM `BIODATA` WHERE ID = ?')) {
      const id = parseInt(params[0], 10);
      const initLen = fallbackBiodata.length;
      fallbackBiodata = fallbackBiodata.filter(b => b.id !== id);
      const affected = initLen - fallbackBiodata.length;
      return [{ affectedRows: affected }];
    }

    // Cek keberadaan ID
    if (trimmed.startsWith('SELECT ID FROM `BIODATA` WHERE ID = ?')) {
      const id = parseInt(params[0], 10);
      const found = fallbackBiodata.filter(b => b.id === id);
      return [found];
    }

    return [[]];
  }
};

async function initDatabase() {
  try {
    console.log(`Mencoba menghubungkan ke MySQL di ${dbConfig.host}:${dbConfig.port}...`);

    // Timeout 3 detik untuk deteksi koneksi MySQL
    const connectionPromise = mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      connectTimeout: 3000
    });

    const tempConnection = await connectionPromise;

    await tempConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await tempConnection.end();

    pool = mysql.createPool(dbConfig);

    // Buat tabel users jika belum ada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(50) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Buat tabel biodata jika belum ada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`biodata\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`nama_lengkap\` VARCHAR(50) NOT NULL,
        \`alamat\` VARCHAR(100) NOT NULL,
        \`tanggal_lahir\` DATE NOT NULL,
        \`nomor_telepon\` VARCHAR(15) NOT NULL,
        \`jenis_kelamin\` ENUM('Laki-laki', 'Perempuan') NOT NULL,
        \`jurusan\` VARCHAR(50) NOT NULL,
        \`bahasa\` VARCHAR(100) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Cek apakah tabel users sudah ada akun default
    const [userRows] = await pool.query('SELECT COUNT(*) as count FROM `users`');
    if (userRows[0].count === 0) {
      console.log('Menambahkan akun user default ke database MySQL...');
      const salt = await bcrypt.genSalt(10);
      const hashSauce = await bcrypt.hash('secret_sauce', salt);
      const hashAdmin = await bcrypt.hash('admin123', salt);

      await pool.query(
        'INSERT INTO `users` (`username`, `password`) VALUES (?, ?), (?, ?)',
        ['standard_user', hashSauce, 'admin', hashAdmin]
      );
      console.log('Akun default MySQL berhasil dibuat!');
    }

    // Cek apakah ada data awal biodata
    const [bioRows] = await pool.query('SELECT COUNT(*) as count FROM `biodata`');
    if (bioRows[0].count === 0) {
      console.log('Menambahkan contoh data biodata awal ke database MySQL...');
      await pool.query(`
        INSERT INTO \`biodata\` (\`nama_lengkap\`, \`alamat\`, \`tanggal_lahir\`, \`nomor_telepon\`, \`jenis_kelamin\`, \`jurusan\`, \`bahasa\`) VALUES
        ('Budi Santoso', 'Jl. Merdeka No. 45, Jakarta Pusat', '1998-05-14', '+6281234567890', 'Laki-laki', 'Teknik Informatika', 'Indonesia, Inggris'),
        ('Siti Rahmawati', 'Jl. Sudirman No. 88, Bandung', '2000-09-21', '+6285678901234', 'Perempuan', 'Sistem Informasi', 'Indonesia, Jepang'),
        ('Ahmad Fauzi', 'Jl. Diponegoro No. 12, Surabaya', '1999-12-03', '+6287890123456', 'Laki-laki', 'Teknik Elektro', 'Indonesia, Jerman');
      `);
      console.log('Contoh biodata MySQL berhasil disiapkan!');
    }

    isFallbackMode = false;
    console.log(`[SUCCESS] Database MySQL "${dbConfig.database}" terhubung dan siap digunakan.`);
    return pool;
  } catch (error) {
    console.warn(`[INFO] MySQL di ${dbConfig.host}:${dbConfig.port} belum aktif: ${error.message}`);
    console.log('[INFO] Mengaktifkan Mode Fallback Database Lokal agar aplikasi tetap dapat diuji coba langsung.');
    await initFallbackData();
    isFallbackMode = true;
    pool = fallbackPool;
    return pool;
  }
}

function getPool() {
  if (!pool) {
    return fallbackPool;
  }
  return pool;
}

function isUsingFallback() {
  return isFallbackMode;
}

module.exports = {
  initDatabase,
  getPool,
  isUsingFallback,
  dbConfig,
};
