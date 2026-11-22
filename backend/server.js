require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ===== 1. SECURITY & MIDDLEWARE =====
app.use(helmet());

// Konfigurasi CORS yang lebih aman
// Jika CLIENT_URL ada di .env (misal: http://localhost:3000), gunakan itu.
// Jika tidak, izinkan localhost (untuk development).
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',') 
  : ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'];

app.use(cors({
  origin: function (origin, callback) {
    // Izinkan request tanpa origin (seperti Postman/mobile app)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Diblokir oleh CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Rate limiting (Mencegah spam request)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 200, // Maksimal 200 request per IP per 15 menit
  message: { error: 'Terlalu banyak request, coba lagi nanti.' }
});
app.use('/api/', limiter);

// ===== 2. DATABASE =====
connectDB();

// ===== 3. ROUTES API =====
app.use('/api/auth', require('./routes/auth'));           // Login & Register
app.use('/api/wedding', require('./routes/wedding'));     // Buat & Gabung Wedding Plan
app.use('/api/tasks', require('./routes/tasks'));         // Timeline Agenda
app.use('/api/checklist', require('./routes/checklist')); // Wedding Checklist
app.use('/api/budget', require('./routes/budget'));       // Budget & Realisasi
app.use('/api/guests', require('./routes/guests'));       // Daftar Tamu
app.use('/api/vendors', require('./routes/vendors'));     // Vendor (Katering, MUA, dll)
app.use('/api/locations', require('./routes/location')); // Venue (Lokasi Gedung)
app.use('/api/upload', require('./routes/upload'));       // Upload Foto (Cloudinary)
app.use('/api/itineraries', require('./routes/itineraries'));
app.use('/api/notes', require('./routes/notes'));

// ===== 4. HEALTH CHECK =====
// Berguna untuk mengecek apakah server menyala (buka di browser: http://localhost:5000/api/health)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Wedding Planner API is running',
    timestamp: new Date().toISOString() 
  });
});

// ===== 5. ERROR HANDLER =====
// Harus diletakkan paling bawah setelah semua route
app.use(errorHandler);

// ===== 6. JALANKAN SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
});