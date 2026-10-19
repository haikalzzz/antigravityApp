# Aplikasi Web Manajemen Biodata (SauceDemo Theme)

Aplikasi web sederhana dengan tampilan bertema **SauceDemo** (`https://www.saucedemo.com/`), frontend **HTML5 + CSS3 + Vanilla JavaScript**, backend **Express.js**, containerisasi **Docker & Docker Compose**, dan database **MySQL** yang dapat diakses melalui **DBeaver**.

---

## 🚀 Fitur Utama & Kepatuhan Spesifikasi

1. **Halaman Login SauceDemo Style**:
   - Desain minimalis khas SauceDemo dengan logo, card login, dan banner error merah ikonik (*"Epic sadface..."*).
   - Info kredensial bawaan tercantum di bagian bawah card login.
2. **Autentikasi Database & Validasi**:
   - Username dan password diverifikasi terhadap tabel `users` di database MySQL.
   - Jika username/password salah atau tidak ditemukan, sistem menampilkan pesan error.
3. **API Login & Bearer Token (JWT)**:
   - Endpoint: `POST /api/login`
   - Mengembalikan JWT Bearer Token yang disimpan di `localStorage` browser dan dikirim pada header `Authorization: Bearer <token>` untuk semua request data.
4. **Form Input Biodata Lengkap**:
   - **Nama Lengkap**: `varchar(50)` (dengan validasi atribut `maxlength="50"`).
   - **Alamat**: `text(100)` (dengan live character counter `0 / 100`).
   - **Tanggal Lahir**: datepicker bawaan (`<input type="date">`).
   - **Nomor Telepon**: Awalan otomatis `+62` (`varchar(15)`).
   - **Jenis Kelamin**: Radio button (`Laki-laki` / `Perempuan`).
   - **Jurusan**: Dropdown select berisi 10 jurusan universitas (Teknik Informatika, Sistem Informasi, Teknik Elektro, Teknik Mesin, Teknik Sipil, Manajemen, Akuntansi, Ilmu Komunikasi, Desain Komunikasi Visual, Kedokteran).
   - **Bahasa yang Dikuasai**: Checkbox multi-pilihan (`Indonesia`, `Inggris`, `Jepang`, `Jerman`).
5. **Validasi & Simpan Data**:
   - Jika ada salah satu data yang belum diisi, menampilkan pesan error `"data harus diisi"`.
   - Setelah berhasil disimpan, form langsung dikosongkan secara otomatis.
6. **API POST Biodata**:
   - Endpoint: `POST /api/biodata` (dilindungi Bearer Token).
7. **Tampilan Dibagi 2 (Split View Kiri-Kanan) & Pagination**:
   - Kolom kiri: Form Input Biodata.
   - Kolom kanan: Tabel Data Biodata yang dimuat menggunakan `GET /api/biodata`.
   - Dilengkapi pagination dinamis dengan pilihan limit 10, 25, dan 50 data per halaman.
8. **Tombol Edit dan Hapus**:
   - Setiap baris memiliki tombol **Edit** dan **Hapus**.
   - Hapus data memicu `DELETE /api/biodata/:id` dan menghapus baris dari database secara permanen.
9. **Edit Data di Form Kiri (PUT/PATCH)**:
   - Mengklik tombol Edit akan mengisi form di sebelah kiri dengan data baris yang dipilih.
   - Tombol berubah menjadi *"Perbarui Data"* dan tersedia tombol *"Batal Edit"*.
   - Menyimpan perubahan memicu `PUT /api/biodata/:id` atau `PATCH /api/biodata/:id`.
10. **Tombol Logout & Pop-up Modal CSS**:
    - Tombol Logout di header navigasi membuka popup modal konfirmasi elegan (CSS biasa, kecil di pojok kanan atas dekat tombol Logout).
    - Tidak lagi menggunakan `confirm()` bawaan browser.
    - Mengirim request ke API `POST /api/logout`, membersihkan token/sesi lokal, dan mengarahkan kembali ke halaman login.

---

## 📁 Struktur Direktori

```
TestApp/
├── .env                  # Konfigurasi Environment lokal
├── .env.example          # Template konfigurasi Environment
├── .dockerignore         # File yang dikecualikan dari Docker build
├── Dockerfile            # Dockerfile untuk server Express.js
├── docker-compose.yml    # Konfigurasi container MySQL dan Express.js
├── init.sql              # Script inisialisasi database dan seed data awal
├── package.json          # Node.js dependencies & scripts
├── README.md             # Dokumentasi lengkap proyek
├── server.js             # Entry point Express backend server
├── src/
│   ├── config/
│   │   └── db.js         # Konfigurasi koneksi MySQL + auto migration
│   ├── controllers/
│   │   ├── authController.js    # Logic Login & JWT
│   │   └── biodataController.js # Logic CRUD Biodata + validasi
│   ├── middleware/
│   │   └── authMiddleware.js    # Verifikasi Bearer Token JWT
│   └── routes/
│       ├── authRoutes.js        # Route /api/auth
│       └── biodataRoutes.js     # Route /api/biodata
└── public/
    ├── css/
    │   └── style.css            # Stylesheet tema SauceDemo & responsive layout
    ├── js/
    │   ├── auth.js              # Interaksi halaman Login
    │   └── dashboard.js         # Interaksi Dashboard CRUD & Pagination
    ├── index.html               # Halaman Login
    └── dashboard.html           # Halaman Utama (Form & Tabel Kiri-Kanan)
```

---

## 🔑 Kredensial Login Bawaan

| Username | Password | Keterangan |
| :--- | :--- | :--- |
| `standard_user` | `secret_sauce` | Akun standar bergaya SauceDemo |
| `admin` | `admin123` | Akun administrator |

---

## 🐳 Cara Menjalankan Menggunakan Docker

Pastikan Docker Desktop sudah terpasang dan berjalan di komputer Anda.

1. Buka terminal di folder proyek ini:
   ```bash
   cd "c:\Users\PT HJI - 04\Downloads\TestApp"
   ```

2. Jalankan Docker Compose:
   ```bash
   docker compose up -d --build
   ```

3. Docker akan otomatis:
   - Mengunduh image MySQL 8.0 dan membuat database `testapp_db`.
   - Menjalankan `init.sql` untuk membuat tabel `users` dan `biodata` serta memasukkan akun default.
   - Membuka port MySQL `3306` ke komputer lokal Anda.
   - Mem-build dan menjalankan container Express.js pada port `3000`.

4. Buka browser dan akses:
   ```
   http://localhost:3000
   ```

5. Untuk menghentikan container Docker:
   ```bash
   docker compose down
   ```

---

## 🗄️ Menghubungkan Database MySQL di DBeaver

Anda dapat memantau dan mengelola data tabel secara langsung di **DBeaver**:

1. Buka aplikasi **DBeaver**.
2. Klik menu **Database** > **New Database Connection**.
3. Pilih **MySQL** lalu klik **Next**.
4. Isi konfigurasi koneksi berikut:
   - **Host**: `localhost` atau `127.0.0.1`
   - **Port**: `3306`
   - **Database**: `testapp_db`
   - **Username**: `root` (atau `appuser`)
   - **Password**: `rootpassword` (atau `apppassword` jika menggunakan user `appuser`)
5. Klik **Test Connection** untuk memastikan koneksi berhasil.
   *(Jika DBeaver meminta download MySQL driver, klik Download)*.
6. Klik **Finish**.
7. Anda sekarang dapat melihat tabel:
   - `users`: data username & password login.
   - `biodata`: seluruh data mahasiswa/biodata yang disimpan melalui form web.

---

## 💻 Cara Menjalankan Tanpa Docker (Langsung dengan Node.js)

1. Pastikan dependencies sudah terinstall:
   ```bash
   npm install
   ```
2. Jalankan aplikasi:
   ```bash
   npm start
   ```
3. Buka browser di:
   ```
   http://localhost:3000
   ```
*(Catatan: Backend dilengkapi sistem auto-fallback otomatis, sehingga Anda dapat langsung menguji coba form, login, tabel, edit, hapus, dan pagination di browser meskipun database MySQL belum dinyalakan).*

---

## 📡 Daftar API Endpoint

| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/login` | Publik | Login user & mendapatkan Bearer Token |
| `POST` | `/api/logout` | Bearer Token | Logout user & mengakhiri sesi |
| `GET` | `/api/biodata` | Bearer Token | Ambil data biodata dengan query `page` & `limit` |
| `GET` | `/api/biodata/:id` | Bearer Token | Ambil detail satu biodata berdasarkan ID |
| `POST` | `/api/biodata` | Bearer Token | Simpan data biodata baru (validasi semua kolom) |
| `PUT` | `/api/biodata/:id` | Bearer Token | Perbarui seluruh data biodata |
| `PATCH`| `/api/biodata/:id` | Bearer Token | Perbarui sebagian/seluruh data biodata |
| `DELETE`| `/api/biodata/:id` | Bearer Token | Hapus data biodata dari database |
