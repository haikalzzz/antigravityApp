-- Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS `testapp_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `testapp_db`;

-- Tabel User untuk autentikasi login
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Biodata sesuai spesifikasi
CREATE TABLE IF NOT EXISTS `biodata` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_lengkap` VARCHAR(50) NOT NULL,
  `alamat` VARCHAR(100) NOT NULL,
  `tanggal_lahir` DATE NOT NULL,
  `nomor_telepon` VARCHAR(15) NOT NULL,
  `jenis_kelamin` ENUM('Laki-laki', 'Perempuan') NOT NULL,
  `jurusan` VARCHAR(50) NOT NULL,
  `bahasa` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hapus data user lama bila ada duplikat untuk reset aman
DELETE FROM `users` WHERE `username` IN ('standard_user', 'admin');

-- Masukkan akun default (password bcrypt & plain untuk fleksibilitas hash/auth)
-- standard_user : secret_sauce  (gaya saucedemo)
-- admin : admin123
INSERT INTO `users` (`username`, `password`) VALUES
('standard_user', '$2a$10$4LpU1M6ePuLtGw/Svlq98O3JJntNe/dWFApPOlENyNkQsomQMp8Fy'),
('admin', '$2a$10$5u5Rp/219Rm7RHY/Y8fXO.gkcdhEEcK4qEL5vw8zA7QSa2i71PKKa');

-- Data dummy awal untuk tabel biodata agar tabel langsung memiliki data contoh
INSERT INTO `biodata` (`nama_lengkap`, `alamat`, `tanggal_lahir`, `nomor_telepon`, `jenis_kelamin`, `jurusan`, `bahasa`) VALUES
('Budi Santoso', 'Jl. Merdeka No. 45, Jakarta Pusat', '1998-05-14', '+6281234567890', 'Laki-laki', 'Teknik Informatika', 'Indonesia, Inggris'),
('Siti Rahmawati', 'Jl. Sudirman No. 88, Bandung', '2000-09-21', '+6285678901234', 'Perempuan', 'Sistem Informasi', 'Indonesia, Jepang'),
('Ahmad Fauzi', 'Jl. Diponegoro No. 12, Surabaya', '1999-12-03', '+6287890123456', 'Laki-laki', 'Teknik Elektro', 'Indonesia, Jerman');
