// ==========================================================================
// Dashboard JavaScript - Manajemen Biodata
// ==========================================================================

let currentPage = 1;
let currentLimit = 10;
let totalPages = 1;
let totalData = 0;
let isEditMode = false;

// 1. Verifikasi Autentikasi saat halaman dibuka
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  if (!token) {
    // Jika tidak ada token, paksa kembali ke login
    window.location.href = 'index.html';
    return;
  }

  // Tampilkan username yang sedang login
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      document.getElementById('logged-username').innerText = user.username || 'User';
    } catch (e) {
      document.getElementById('logged-username').innerText = 'User';
    }
  }

  // Listener untuk form submit
  const form = document.getElementById('biodata-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Listener live character count untuk alamat
  const alamatInput = document.getElementById('alamat');
  const alamatCount = document.getElementById('alamat-count');
  if (alamatInput && alamatCount) {
    alamatInput.addEventListener('input', () => {
      alamatCount.innerText = alamatInput.value.length;
    });
  }

  // Listener input nomor telepon (hanya digit, batasi 12 digit tambahan setelah +62)
  const phoneInput = document.getElementById('nomor_telepon');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, ''); // hanya angka
      if (val.startsWith('62')) {
        val = val.substring(2);
      } else if (val.startsWith('0')) {
        val = val.substring(1);
      }
      e.target.value = val.substring(0, 12);
    });
  }

  // Muat data awal ke tabel
  loadBiodataData();
});

// Helper Headers dengan Bearer Token
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// 2. Fungsi Kontrol Modal Logout & Hit API Logout
function toggleLogoutModal(e) {
  if (e) e.stopPropagation();
  const modal = document.getElementById('logout-modal');
  if (modal) {
    const isShowing = modal.style.display === 'block';
    modal.style.display = isShowing ? 'none' : 'block';
  }
}

function closeLogoutModal() {
  const modal = document.getElementById('logout-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Tutup modal jika klik di luar area popup
document.addEventListener('click', (e) => {
  const modal = document.getElementById('logout-modal');
  const logoutBtn = document.getElementById('logout-button');
  if (modal && modal.style.display === 'block') {
    if (!modal.contains(e.target) && e.target !== logoutBtn) {
      closeLogoutModal();
    }
  }
});

// Eksekusi Logout via API
async function executeLogout() {
  const btnConfirm = document.getElementById('btn-confirm-logout');
  if (btnConfirm) {
    btnConfirm.innerText = 'Keluar...';
    btnConfirm.disabled = true;
  }

  try {
    // Hit API logout dengan Bearer Token
    await fetch('/api/logout', {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } catch (err) {
    console.warn('Gagal memanggil API logout:', err);
  } finally {
    // Hapus sesi lokal dan arahkan ke login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  }
}

// 3. Notifikasi Alert Form
function showFormError(message) {
  const errorBox = document.getElementById('form-error');
  const successBox = document.getElementById('form-success');
  if (successBox) successBox.style.display = 'none';
  if (errorBox) {
    errorBox.innerText = message || 'data harus diisi';
    errorBox.style.display = 'block';
  }
}

function showFormSuccess(message) {
  const errorBox = document.getElementById('form-error');
  const successBox = document.getElementById('form-success');
  if (errorBox) errorBox.style.display = 'none';
  if (successBox) {
    successBox.innerText = message || 'Data berhasil disimpan!';
    successBox.style.display = 'block';
  }
  // Sembunyikan notifikasi setelah 4 detik
  setTimeout(() => {
    if (successBox) successBox.style.display = 'none';
  }, 4000);
}

function clearAlerts() {
  const errorBox = document.getElementById('form-error');
  const successBox = document.getElementById('form-success');
  if (errorBox) errorBox.style.display = 'none';
  if (successBox) successBox.style.display = 'none';
}

// 4. Reset Form ke kondisi awal (kosong)
function resetForm() {
  isEditMode = false;
  document.getElementById('edit-id').value = '';
  document.getElementById('form-title').innerText = 'Input Biodata Baru';
  document.getElementById('btn-save').innerText = 'Simpan Data';
  document.getElementById('btn-cancel').style.display = 'none';

  // Kosongkan semua input
  document.getElementById('nama_lengkap').value = '';
  document.getElementById('alamat').value = '';
  document.getElementById('alamat-count').innerText = '0';
  document.getElementById('tanggal_lahir').value = '';
  document.getElementById('nomor_telepon').value = '';

  // Uncheck radio jenis kelamin
  const radioGenders = document.querySelectorAll('input[name="jenis_kelamin"]');
  radioGenders.forEach(radio => radio.checked = false);

  // Reset dropdown jurusan
  document.getElementById('jurusan').value = '';

  // Uncheck semua checkbox bahasa
  const checkboxes = document.querySelectorAll('input[name="bahasa"]');
  checkboxes.forEach(cb => cb.checked = false);

  clearAlerts();
}

// 5. Mengambil Data dan Merender ke Tabel (API GET)
async function loadBiodataData() {
  const tableBody = document.getElementById('biodata-table-body');
  const totalBadge = document.getElementById('total-badge');
  const pageIndicator = document.getElementById('page-indicator');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  tableBody.innerHTML = `<tr><td colspan="9" class="empty-table-row">Sedang mengambil data...</td></tr>`;

  try {
    const response = await fetch(`/api/biodata?page=${currentPage}&limit=${currentLimit}`, {
      headers: getAuthHeaders()
    });

    if (response.status === 401) {
      alert('Sesi Anda telah berakhir. Silakan login kembali.');
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }

    const result = await response.json();

    if (!result.success) {
      tableBody.innerHTML = `<tr><td colspan="9" class="empty-table-row" style="color:#e2231a;">Gagal memuat data: ${result.message}</td></tr>`;
      return;
    }

    const data = result.data || [];
    totalData = result.pagination.total;
    totalPages = result.pagination.totalPages;

    // Update status badge total
    totalBadge.innerText = `Total: ${totalData} Data`;

    // Update pagination UI
    pageIndicator.innerText = `Halaman ${currentPage} dari ${totalPages || 1}`;
    btnPrev.disabled = (currentPage <= 1);
    btnNext.disabled = (currentPage >= totalPages);

    if (data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="empty-table-row">Belum ada data biodata tersimpan. Silakan isi form di sebelah kiri.</td></tr>`;
      return;
    }

    // Render baris tabel
    let html = '';
    data.forEach((item, index) => {
      const rowNo = (currentPage - 1) * currentLimit + index + 1;
      
      // Gender badge styling
      const isLaki = item.jenis_kelamin === 'Laki-laki';
      const genderBadge = `<span class="badge-gender ${isLaki ? 'l' : 'p'}">${escapeHtml(item.jenis_kelamin)}</span>`;

      // Bahasa tags
      const bahasaList = item.bahasa ? item.bahasa.split(',') : [];
      const bahasaBadges = bahasaList.map(b => `<span class="badge-bahasa">${escapeHtml(b.trim())}</span>`).join(' ');

      // JSON encoded item string untuk passing ke tombol Edit
      const itemDataEscaped = encodeURIComponent(JSON.stringify(item));

      html += `
        <tr>
          <td style="font-weight: 600; text-align: center;">${rowNo}</td>
          <td><strong>${escapeHtml(item.nama_lengkap)}</strong></td>
          <td style="max-width: 200px; word-break: break-word;">${escapeHtml(item.alamat)}</td>
          <td>${escapeHtml(item.tanggal_lahir)}</td>
          <td><code>${escapeHtml(item.nomor_telepon)}</code></td>
          <td>${genderBadge}</td>
          <td><span class="badge-jurusan">${escapeHtml(item.jurusan)}</span></td>
          <td>${bahasaBadges}</td>
          <td style="text-align: center;">
            <div class="table-actions">
              <button 
                type="button" 
                class="btn-action-edit" 
                onclick="handleEditBiodata('${itemDataEscaped}')"
              >
                ✏️ Edit
              </button>
              <button 
                type="button" 
                class="btn-action-delete" 
                onclick="handleDeleteBiodata(${item.id}, '${escapeHtml(item.nama_lengkap)}')"
              >
                🗑️ Hapus
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;

  } catch (error) {
    console.error('Error fetching biodata:', error);
    tableBody.innerHTML = `<tr><td colspan="9" class="empty-table-row" style="color:#e2231a;">Gagal terhubung ke server.</td></tr>`;
  }
}

// 6. Handle Simpan (POST) & Perbarui (PUT)
async function handleFormSubmit(e) {
  e.preventDefault();
  clearAlerts();

  const editId = document.getElementById('edit-id').value;
  const nama_lengkap = document.getElementById('nama_lengkap').value.trim();
  const alamat = document.getElementById('alamat').value.trim();
  const tanggal_lahir = document.getElementById('tanggal_lahir').value;
  let rawPhone = document.getElementById('nomor_telepon').value.trim();
  const jurusan = document.getElementById('jurusan').value;

  // Ambil nilai radio jenis kelamin
  const selectedGender = document.querySelector('input[name="jenis_kelamin"]:checked');
  const jenis_kelamin = selectedGender ? selectedGender.value : '';

  // Ambil nilai checkbox bahasa yang dicentang
  const selectedBahasaCheckboxes = document.querySelectorAll('input[name="bahasa"]:checked');
  const bahasaArray = Array.from(selectedBahasaCheckboxes).map(cb => cb.value);

  // Validasi: jika ada salah satu data yang tidak diisi -> error "data harus diisi"
  if (
    !nama_lengkap ||
    !alamat ||
    !tanggal_lahir ||
    !rawPhone ||
    !jenis_kelamin ||
    !jurusan ||
    bahasaArray.length === 0
  ) {
    showFormError('data harus diisi');
    return;
  }

  // Format nomor telepon +62
  const nomor_telepon = '+62' + rawPhone;

  const payload = {
    nama_lengkap,
    alamat,
    tanggal_lahir,
    nomor_telepon,
    jenis_kelamin,
    jurusan,
    bahasa: bahasaArray
  };

  const saveBtn = document.getElementById('btn-save');
  const originalText = saveBtn.innerText;
  saveBtn.innerText = 'Menyimpan...';
  saveBtn.disabled = true;

  try {
    let url = '/api/biodata';
    let method = 'POST';

    if (editId) {
      url = `/api/biodata/${editId}`;
      method = 'PUT';
    }

    const response = await fetch(url, {
      method: method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      showFormError(result.message || 'data harus diisi');
      return;
    }

    // Berhasil disimpan / diperbarui
    showFormSuccess(result.message || (editId ? 'Data berhasil diperbarui!' : 'Data berhasil disimpan!'));

    // Form langsung dikosongkan sesuai instruksi nomor 5
    resetForm();

    // Refresh tabel biodata
    loadBiodataData();

  } catch (error) {
    console.error('Error saving biodata:', error);
    showFormError('Gagal menyimpan data ke server.');
  } finally {
    saveBtn.innerText = isEditMode ? 'Perbarui Data' : 'Simpan Data';
    saveBtn.disabled = false;
  }
}

// 7. Handle Klik Tombol Edit pada Baris Tabel
function handleEditBiodata(encodedData) {
  try {
    const item = JSON.parse(decodeURIComponent(encodedData));
    isEditMode = true;
    clearAlerts();

    // Isi ID edit
    document.getElementById('edit-id').value = item.id;
    document.getElementById('form-title').innerText = `Edit Data Biodata (ID: ${item.id})`;
    document.getElementById('btn-save').innerText = 'Perbarui Data';
    document.getElementById('btn-cancel').style.display = 'inline-block';

    // Isi Nama & Alamat
    document.getElementById('nama_lengkap').value = item.nama_lengkap;
    document.getElementById('alamat').value = item.alamat;
    document.getElementById('alamat-count').innerText = item.alamat.length;

    // Isi Tanggal Lahir (Format: YYYY-MM-DD)
    if (item.tanggal_lahir) {
      const dt = item.tanggal_lahir.substring(0, 10);
      document.getElementById('tanggal_lahir').value = dt;
    }

    // Isi Nomor Telepon (buang awalan +62 untuk ditampilkan di input)
    let cleanPhone = item.nomor_telepon ? item.nomor_telepon.replace(/^\+62|^62|^0/, '') : '';
    document.getElementById('nomor_telepon').value = cleanPhone;

    // Pilih Radio Jenis Kelamin
    const radios = document.querySelectorAll('input[name="jenis_kelamin"]');
    radios.forEach(radio => {
      radio.checked = (radio.value === item.jenis_kelamin);
    });

    // Pilih Dropdown Jurusan
    document.getElementById('jurusan').value = item.jurusan || '';

    // Centang Checkbox Bahasa
    const checkboxes = document.querySelectorAll('input[name="bahasa"]');
    const existingBahasa = item.bahasa ? item.bahasa.split(',').map(s => s.trim()) : [];
    checkboxes.forEach(cb => {
      cb.checked = existingBahasa.includes(cb.value);
    });

    // Scroll halus ke form kiri agar user langsung melihat data yang diedit
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (e) {
    console.error('Error parsing item for edit:', e);
    showFormError('Gagal memuat data untuk diedit.');
  }
}

// 8. Handle Hapus Data (API DELETE)
async function handleDeleteBiodata(id, name) {
  const confirmed = confirm(`Apakah Anda yakin ingin menghapus biodata milik "${name}"? Data akan dihapus permanen dari database.`);
  if (!confirmed) return;

  try {
    const response = await fetch(`/api/biodata/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      alert('Gagal menghapus data: ' + (result.message || 'Error server'));
      return;
    }

    // Jika yang sedang diedit adalah data yang dihapus, reset form
    if (document.getElementById('edit-id').value == id) {
      resetForm();
    }

    showFormSuccess(`Biodata milik "${name}" berhasil dihapus.`);
    loadBiodataData();

  } catch (error) {
    console.error('Error deleting biodata:', error);
    alert('Terjadi kesalahan saat menghapus data.');
  }
}

// 9. Pagination Navigasi
function changeLimit(newLimit) {
  currentLimit = parseInt(newLimit, 10) || 10;
  currentPage = 1;
  loadBiodataData();
}

function goToPrevPage() {
  if (currentPage > 1) {
    currentPage--;
    loadBiodataData();
  }
}

function goToNextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    loadBiodataData();
  }
}

// Helper untuk sanitasi karakter HTML mencegah XSS
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
