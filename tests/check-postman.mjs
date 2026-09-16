#!/usr/bin/env node
/**
 * Kiểm tra tính hợp lệ của bộ sưu tập Postman vừa sinh.
 *   node tests/check-postman.mjs
 *
 * Kiểm tra:
 *   1. JSON đọc được, đúng schema v2.1.0
 *   2. Mỗi request có method + url hợp lệ
 *   3. Mọi biến {{...}} dùng trong request đều đã được khai báo
 *   4. Không trùng tên request
 *   5. Mọi request đều có script kiểm thử
 *   6. Mọi test script đều có ngoặc cân bằng
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, 'KIMDONG_API.postman_collection.json');

let errors = 0;
let warnings = 0;
const fail = (m) => { console.log('  [LOI]  ' + m); errors++; };
const warn = (m) => { console.log('  [CANH BAO] ' + m); warnings++; };

// ------------------------------------------------------------------ Đọc file --
let col;
try {
  col = JSON.parse(fs.readFileSync(FILE, 'utf8'));
} catch (e) {
  console.log('Khong doc duoc JSON: ' + e.message);
  process.exit(1);
}
console.log('Da doc: ' + path.basename(FILE));

// ---------------------------------------------------------------- 1. Schema ---
if (col.info?.schema !== 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json') {
  fail('schema khong phai v2.1.0');
} else {
  console.log('[OK] schema v2.1.0');
}
if (!col.info?.name) fail('thieu info.name');

// ------------------------------------------------------- 2..5 Duyet request ---
const declared = new Set((col.variable || []).map((v) => v.key));
// Biến do script tự tạo ra trong lúc chạy
const runtimeVars = new Set([
  'newBookId', 'newBookId2', 'newCategoryId', 'newAuthorId', 'newBannerId',
  'newPromotionId', 'newUserId', 'cartItemId', 'orderId', 'shipOrderId',
  'freeShipOrderId', 'refundOrderId', 'stock3Before', 'viCategoryId',
  'adminToken', 'empToken', 'cusToken', 'baseUrl'
]);

const names = new Map();
const usedVars = new Set();
let nReq = 0, nTest = 0, nBody = 0;

function walk(items, folderName) {
  for (const it of items) {
    if (it.item) { walk(it.item, it.name); continue; }
    nReq++;

    if (names.has(it.name)) fail(`trung ten request: "${it.name}" (${names.get(it.name)} va ${folderName})`);
    else names.set(it.name, folderName);

    const r = it.request;
    if (!r) { fail(`request "${it.name}" thieu truong request`); continue; }
    if (!r.method) fail(`request "${it.name}" thieu method`);
    if (!r.url?.raw) fail(`request "${it.name}" thieu url.raw`);
    if (!r.url.raw.startsWith('{{baseUrl}}')) {
      fail(`request "${it.name}" url khong bat dau bang {{baseUrl}}: ${r.url.raw}`);
    }
    if (!Array.isArray(r.url.path) || r.url.path.length === 0) {
      fail(`request "${it.name}" thieu url.path`);
    }
    if (r.body) {
      nBody++;
      try { JSON.parse(r.body.raw); }
      catch { fail(`request "${it.name}" body khong phai JSON hop le`); }
    }

    // Thu thập biến dùng trong url + body
    const text = r.url.raw + (r.body?.raw || '');
    for (const m of text.matchAll(/\{\{([^}]+)\}\}/g)) usedVars.add(m[1]);

    // Script kiểm thử
    const ev = (it.event || []).find((e) => e.listen === 'test');
    if (!ev) { warn(`request "${it.name}" khong co script kiem thu`); continue; }
    const src = ev.script.exec.join('\n');
    const n = (src.match(/pm\.test\(/g) || []).length;
    nTest += n;

    // Ngoặc cân bằng
    let depth = 0, min = 0;
    for (const ch of src) {
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth < min) min = depth; }
    }
    if (depth !== 0) fail(`script "${it.name}" lech ngoac nhon (${depth})`);
    if (min < 0) fail(`script "${it.name}" dong ngoac som`);

    let par = 0;
    for (const ch of src) {
      if (ch === '(') par++;
      else if (ch === ')') par--;
    }
    if (par !== 0) fail(`script "${it.name}" lech ngoac tron (${par})`);

    // Cú pháp JS của script. Chỉ kiểm tra cú pháp, không thực thi.
    // Script kiểm thử chỉ dùng biến tự do `pm`, nên chỉ cần khai báo tham số đó.
    try { new Function('pm', src); }
    catch (e) { fail(`script "${it.name}" loi cu phap: ${e.message}`); }
  }
}
walk(col.item, '(goc)');

// ---------------------------------------------------------- 3. Biến khai báo -
for (const v of usedVars) {
  if (!declared.has(v) && !runtimeVars.has(v)) fail(`bien {{${v}}} dung nhung khong khai bao`);
}

// -------------------------------------------------------------- 6. Cấu trúc ---
if (!col.event?.some((e) => e.listen === 'prerequest')) fail('thieu pre-request script cap bo suu tap');
if (!col.auth) warn('thieu auth cap bo suu tap');
if (!col.variable?.some((v) => v.key === 'baseUrl')) fail('thieu bien baseUrl');

// ---------------------------------------------------------------- Tổng kết ----
console.log('');
console.log('  So folder     : ' + col.item.length);
console.log('  So request    : ' + nReq);
console.log('  So body JSON  : ' + nBody);
console.log('  So kiem thu   : ' + nTest);
console.log('  So bien       : ' + (col.variable || []).length);
console.log('  Bien duoc dung: ' + usedVars.size);
console.log('');
if (errors === 0) {
  console.log('KET QUA: HOP LE' + (warnings ? ` (${warnings} canh bao)` : ''));
} else {
  console.log(`KET QUA: CO ${errors} LOI` + (warnings ? ` va ${warnings} canh bao` : ''));
}
process.exit(errors === 0 ? 0 : 1);
