// Inisialisasi halaman login
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    // Jika sudah ada token, verifikasi atau langsung arahkan ke dashboard
    fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        window.location.href = 'dashboard.html';
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    })
    .catch(() => {
      // Abaikan jika offline / koneksi gagal
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});

function showLoginError(message) {
  const errorBox = document.getElementById('login-error');
  const errorMsg = document.getElementById('login-error-msg');
  if (errorBox && errorMsg) {
    errorMsg.innerText = message || 'Epic sadface: Username and password do not match any user in this service';
    errorBox.style.display = 'flex';
  }
}

function dismissLoginError() {
  const errorBox = document.getElementById('login-error');
  if (errorBox) {
    errorBox.style.display = 'none';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  dismissLoginError();

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('login-button');

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showLoginError('Epic sadface: Username and password are required');
    return;
  }

  // Tampilkan efek loading
  const originalBtnText = loginBtn.innerText;
  loginBtn.innerText = 'Memproses...';
  loginBtn.disabled = true;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      showLoginError(result.message || 'Username atau password tidak sesuai.');
      return;
    }

    // Simpan token Bearer dan informasi user di localStorage
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));

    // Arahkan ke halaman utama / biodata
    window.location.href = 'dashboard.html';
  } catch (err) {
    console.error('Login error:', err);
    showLoginError('Gagal terhubung ke server. Pastikan server backend sedang berjalan.');
  } finally {
    loginBtn.innerText = originalBtnText;
    loginBtn.disabled = false;
  }
}
