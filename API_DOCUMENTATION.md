# 📚 Dokumentasi Lengkap RESTful API - Biodata App

Base URL: `http://localhost:3000`

Semua request yang membutuhkan autentikasi harus menyertakan header:
```http
Authorization: Bearer <token_jwt_anda>
```

---

## 1. Auth: Login Pengguna
Mengautentikasi pengguna dan mengembalikan JWT Bearer Token.

- **URL**: `/api/login`
- **Method**: `POST`
- **Header**:
  - `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "username": "standard_user",
    "password": "secret_sauce"
  }
  ```
- **Response Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login berhasil!",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
    "user": {
      "id": 1,
      "username": "standard_user"
    }
  }
  ```
- **Response Gagal (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "Username atau password salah!"
  }
  ```

---

## 2. Auth: Logout Pengguna
Mengakhiri sesi pengguna.

- **URL**: `/api/logout`
- **Method**: `POST`
- **Header**:
  - `Authorization: Bearer <token>`
- **Response Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logout berhasil. Sesi telah diakhiri."
  }
  ```

---

## 3. Biodata: Ambil Semua Data (Pagination)
Mengambil daftar biodata yang tersimpan di MySQL dengan fitur pembagian halaman.

- **URL**: `/api/biodata?page=1&limit=10`
- **Method**: `GET`
- **Header**:
  - `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page` (opsional, default: `1`): nomor halaman.
  - `limit` (opsional, default: `10`): jumlah data per halaman (`10`, `25`, `50`).
- **Response Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "nama_lengkap": "Budi Santoso",
        "alamat": "Jl. Merdeka No. 45, Jakarta Pusat",
        "tanggal_lahir": "1998-05-14",
        "nomor_telepon": "+6281234567890",
        "jenis_kelamin": "Laki-laki",
        "jurusan": "Teknik Informatika",
        "bahasa": "Indonesia, Inggris",
        "created_at": "2026-10-15T03:39:37.000Z",
        "updated_at": "2026-10-15T03:39:37.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

---

## 4. Biodata: Simpan Data Baru
Menyimpan record biodata baru ke dalam database.

- **URL**: `/api/biodata`
- **Method**: `POST`
- **Header**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Ketentuan Field**:
  - `nama_lengkap`: varchar (maksimal 50 karakter) - *wajib*
  - `alamat`: text (maksimal 100 karakter) - *wajib*
  - `tanggal_lahir`: format `YYYY-MM-DD` - *wajib*
  - `nomor_telepon`: diawali `+62` (maksimal 15 karakter) - *wajib*
  - `jenis_kelamin`: `"Laki-laki"` atau `"Perempuan"` - *wajib*
  - `jurusan`: string nama jurusan - *wajib*
  - `bahasa`: array string atau string dipisah koma - *wajib*
- **Request Body (JSON)**:
  ```json
  {
    "nama_lengkap": "Ashraf Rozaan",
    "alamat": "Jalan Inspeksi Saluran Kalimalang No. 18, Kota Bekasi",
    "tanggal_lahir": "1999-01-01",
    "nomor_telepon": "+6285894724105",
    "jenis_kelamin": "Laki-laki",
    "jurusan": "Teknik Sipil",
    "bahasa": ["Indonesia", "Jerman"]
  }
  ```
- **Response Sukses (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Data biodata berhasil disimpan!",
    "data": {
      "id": 2,
      "nama_lengkap": "Ashraf Rozaan",
      "alamat": "Jalan Inspeksi Saluran Kalimalang No. 18, Kota Bekasi",
      "tanggal_lahir": "1999-01-01",
      "nomor_telepon": "+6285894724105",
      "jenis_kelamin": "Laki-laki",
      "jurusan": "Teknik Sipil",
      "bahasa": "Indonesia, Jerman"
    }
  }
  ```
- **Response Validasi Gagal (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "data harus diisi"
  }
  ```

---

## 5. Biodata: Ambil Detail Berdasarkan ID
- **URL**: `/api/biodata/:id` (contoh: `/api/biodata/1`)
- **Method**: `GET`
- **Header**:
  - `Authorization: Bearer <token>`
- **Response Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "nama_lengkap": "Budi Santoso",
      "alamat": "Jl. Merdeka No. 45, Jakarta Pusat",
      "tanggal_lahir": "1998-05-14",
      "nomor_telepon": "+6281234567890",
      "jenis_kelamin": "Laki-laki",
      "jurusan": "Teknik Informatika",
      "bahasa": "Indonesia, Inggris"
    }
  }
  ```

---

## 6. Biodata: Perbarui Data (Edit)
- **URL**: `/api/biodata/:id` (contoh: `/api/biodata/1`)
- **Method**: `PUT` atau `PATCH`
- **Header**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "nama_lengkap": "Budi Santoso Baru",
    "alamat": "Jl. Sudirman No. 10, Jakarta",
    "tanggal_lahir": "1998-05-14",
    "nomor_telepon": "+6281234567890",
    "jenis_kelamin": "Laki-laki",
    "jurusan": "Teknik Informatika",
    "bahasa": ["Indonesia", "Inggris", "Jepang"]
  }
  ```
- **Response Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data biodata berhasil diperbarui!",
    "data": { ... }
  }
  ```

---

## 7. Biodata: Hapus Data
- **URL**: `/api/biodata/:id` (contoh: `/api/biodata/1`)
- **Method**: `DELETE`
- **Header**:
  - `Authorization: Bearer <token>`
- **Response Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data biodata berhasil dihapus!"
  }
  ```
