import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRouter from './routes/api.js';
import { initDatabase } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Friendly note when opening the API root in a browser (it serves JSON at /api only)
app.get('/', (req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"><title>Kim Dong Bookstore API</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;background:#FAFAF8;color:#1F2937;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .box{background:#fff;border:1px solid #eee;border-left:4px solid #D91C24;border-radius:6px;padding:28px 36px;max-width:520px;box-shadow:0 2px 10px rgba(0,0,0,.06)}
  h1{margin:0 0 6px;font-size:20px;color:#D91C24}
  p{margin:8px 0;font-size:14px;line-height:1.6}
  code{background:#F3F4F6;border-radius:3px;padding:2px 6px;font-size:13px}
  a{color:#D91C24;font-weight:600;text-decoration:none}
  ul{font-size:13px;color:#6B7280;padding-left:18px;margin:10px 0}
</style></head><body><div class="box">
  <h1>🚀 Kim Dong Bookstore API</h1>
  <p>Đây là <b>API backend</b>, không phải trang web. Bạn hãy mở giao diện tại:
  <a href="http://localhost:3000"><code>http://localhost:3000</code></a></p>
  <p>Các endpoint chính:</p>
  <ul>
    <li><code>/api/health</code> — kiểm tra server sống</li>
    <li><code>/api/products</code>, <code>/api/banners</code> — dữ liệu cửa hàng</li>
    <li><code>/api/auth/login</code> — đăng nhập (POST)</li>
  </ul>
</div></body></html>`);
});

// API Endpoints
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Global Error Handler
app.use(errorHandler);

// Initialize DB and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Kim Dong Bookstore Server listening on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error(' Failed to initialize database:', err);
});
