// Ganti dengan URL backend setelah deploy ke Render
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://wedding-backend-anda.onrender.com/api'; // ← ganti URL ini setelah deploy

export async function api(path, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  
  const opts = {
    method,
    headers: { 
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }) // Ini wajib agar bisa akses data privat
    }
  };
  
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(API_URL + path, opts);
    const data = await res.json();
    
    if (!res.ok) {
      // Menangkap error validasi dari express-validator
      const errorMsg = data.error || (data.errors ? data.errors[0].msg : 'Request gagal');
      throw new Error(errorMsg);
    }
    return data;
  } catch (err) {
    // Jika backend mati / tidak bisa dihubungi
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