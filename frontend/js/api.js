// frontend/js/api.js

// Ganti dengan URL backend setelah deploy
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://wedding-backend-anda.onrender.com/api'; // ← ganti setelah deploy

export async function api(path, method = 'GET', body = null) {
  // 1. Ambil token dari localStorage
  const token = localStorage.getItem('token');
  
  const opts = {
    method,
    headers: { 
      'Content-Type': 'application/json',
      // 2. Masukkan token ke header Authorization jika ada
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(API_URL + path, opts);
    
    // Jika server membalas dengan HTML (bukan JSON), biasanya karena error 404/500
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Server Error (Status ${res.status}). Pastikan backend menyala.`);
    }

    const data = await res.json();
    
    if (!res.ok) {
      // Tangkap pesan error dari backend
      const errorMsg = data.error || (data.errors ? data.errors[0].msg : 'Request gagal');
      
      // Jika token expired (401), tendang user ke halaman login
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
      }
      
      throw new Error(errorMsg);
    }
    return data;

  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Tidak dapat terhubung ke server. Pastikan backend Node.js menyala.');
    }
    throw err;
  }
}

export function isLoggedIn() {
  return !!localStorage.getItem('token');
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}