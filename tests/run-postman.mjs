#!/usr/bin/env node
/**
 * Chạy bộ sưu tập Postman bằng Node (mô phỏng Newman, không cần cài thêm gì).
 *
 *   node tests/run-postman.mjs
 *
 * Đọc tests/KIMDONG_API.postman_collection.json rồi thực thi tuần tự:
 *   - Pre-request Script cấp bộ sưu tập (tự đăng nhập lấy token)
 *   - Từng request: thay biến {{...}}, gọi API, chạy Test Script
 *
 * Hỗ trợ đúng những API của Postman mà bộ sưu tập sử dụng:
 *   pm.response.code / .json() / .text()
 *   pm.expect(...)  với chuỗi .to / .have / .be / .at / .nested / .not
 *   pm.test(name, fn)
 *   pm.collectionVariables.get/set
 *   pm.sendRequest(...) -> Promise
 *
 * Biến môi trường:
 *   API_BASE  gốc API, mặc định http://localhost:5099/api
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COLLECTION = path.join(__dirname, 'KIMDONG_API.postman_collection.json');
const API_BASE = (process.env.API_BASE || 'http://localhost:5099/api').replace(/\/$/, '');

// ============================================================ So sánh giá trị ==
const show = (v) => {
  if (typeof v === 'string') return JSON.stringify(v);
  try { return JSON.stringify(v); } catch { return String(v); }
};

const deepEq = (a, b) => {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-9;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  return JSON.stringify(a) === JSON.stringify(b);
};

/** Lấy giá trị theo đường dẫn "a.b.c". */
const pick = (obj, dotPath) =>
  String(dotPath).split('.').reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), obj);

// ================================================== pm.expect (tập con Chai) ==
function expect(actual) {
  return makeChain(actual, false);
}

function makeChain(actual, negated) {
  const check = (cond, msg) => {
    const ok = negated ? !cond : cond;
    if (!ok) throw new Error((negated ? 'KHONG duoc ' : '') + msg);
  };

  const t = {};

  // --- các từ nối chỉ để đọc cho giống tiếng Anh -------------------------
  for (const word of ['to', 'have', 'be', 'at', 'nested', 'that', 'which']) {
    Object.defineProperty(t, word, { get: () => t });
  }
  Object.defineProperty(t, 'not', { get: () => makeChain(actual, !negated) });

  // --- so sánh ----------------------------------------------------------
  t.eql = (v) => { check(deepEq(actual, v), `gia tri ${show(actual)} phai bang ${show(v)}`); return t; };
  t.equal = t.eql;
  t.equals = t.eql;

  t.above = (n) => { check(typeof actual === 'number' && actual > n, `${show(actual)} phai lon hon ${n}`); return t; };
  t.below = (n) => { check(typeof actual === 'number' && actual < n, `${show(actual)} phai nho hon ${n}`); return t; };
  t.most = (n) => { check(typeof actual === 'number' && actual <= n, `${show(actual)} phai nho hon hoac bang ${n}`); return t; };
  t.least = (n) => { check(typeof actual === 'number' && actual >= n, `${show(actual)} phai lon hon hoac bang ${n}`); return t; };
  t.within = (a, b) => { check(typeof actual === 'number' && actual >= a && actual <= b, `${show(actual)} phai trong khoang ${a}..${b}`); return t; };

  t.include = (v) => {
    const cond = Array.isArray(actual)
      ? actual.some((x) => deepEq(x, v))
      : typeof actual === 'string' && actual.includes(v);
    check(cond, `${show(actual)} phai chua ${show(v)}`);
    return t;
  };
  t.contain = t.include;

  t.lengthOf = (n) => {
    const len = actual == null ? -1 : (actual.length ?? Object.keys(actual).length);
    check(len === n, `do dai ${len} phai bang ${n}`);
    return t;
  };

  t.property = (key, value) => {
    // Postman dùng "nested.property" cho đường dẫn có dấu chấm, ví dụ "user.email".
    // Ở đây hỗ trợ luôn cả hai cách cho tiện.
    const keyPath = String(key);
    let found;
    let ok;
    if (keyPath.includes('.')) {
      found = pick(actual, keyPath);
      ok = found !== undefined;
    } else {
      ok = actual != null && Object.prototype.hasOwnProperty.call(actual, keyPath);
      found = ok ? actual[keyPath] : undefined;
    }
    if (value !== undefined) check(ok && deepEq(found, value), `thuoc tinh ${keyPath} phai bang ${show(value)}`);
    else check(ok, `phai co thuoc tinh ${keyPath} (nhan duoc ${show(actual)})`);
    return t;
  };

  t.a = (type) => {
    const ok = type === 'array' ? Array.isArray(actual) : typeof actual === type;
    check(ok, `${show(actual)} phai la kieu ${type}`);
    return t;
  };
  t.an = t.a;
  t.type = t.a;

  // --- trạng thái HTTP ---------------------------------------------------
  t.status = (code) => {
    const got = actual && actual.code;
    check(got === code, `ma trang thai ${got} phai bang ${code}`);
    return t;
  };

  // --- giá trị đặc biệt (dùng dạng thuộc tính, không phải hàm) ----------
  Object.defineProperty(t, 'true', {
    get: () => { check(actual === true, `${show(actual)} phai la true`); return t; }
  });
  Object.defineProperty(t, 'false', {
    get: () => { check(actual === false, `${show(actual)} phai la false`); return t; }
  });
  Object.defineProperty(t, 'null', {
    get: () => { check(actual === null, `${show(actual)} phai la null`); return t; }
  });
  Object.defineProperty(t, 'undefined', {
    get: () => { check(actual === undefined, `${show(actual)} phai la undefined`); return t; }
  });
  Object.defineProperty(t, 'ok', {
    get: () => { check(!!actual, `${show(actual)} phai la gia tri dung`); return t; }
  });
  Object.defineProperty(t, 'empty', {
    get: () => {
      const len = actual == null ? -1 : (actual.length ?? Object.keys(actual).length);
      check(len === 0, `${show(actual)} phai rong`); return t;
    }
  });

  return t;
}

/** Tạo chuỗi kiểm tra cho pm.response (hỗ trợ pm.response.to.have.status). */
function makeResponseChain(response, negated) {
  const check = (cond, msg) => {
    const ok = negated ? !cond : cond;
    if (!ok) throw new Error((negated ? 'KHONG duoc ' : '') + msg);
  };
  const t = {};
  for (const word of ['to', 'have', 'be', 'at', 'that', 'which', 'a', 'an']) {
    Object.defineProperty(t, word, { get: () => t });
  }
  Object.defineProperty(t, 'not', { get: () => makeResponseChain(response, !negated) });
  t.status = (code) => {
    check(response.code === code, `ma trang thai ${response.code} phai bang ${code}`);
    return t;
  };
  return t;
}

// ================================================================== Thay biến ==
function substitute(text, vars) {
  if (typeof text !== 'string') return text;
  // Lặp vài lần để xử lý biến lồng trong biến
  let out = text;
  for (let i = 0; i < 5; i++) {
    const next = out.replace(/\{\{([^}]+)\}\}/g, (m, key) => {
      const v = vars.get(key.trim());
      return v === undefined || v === null ? m : String(v);
    });
    if (next === out) break;
    out = next;
  }
  return out;
}

// ================================================================== Thực thi ==
class Variables {
  constructor(initial) { this.map = new Map(Object.entries(initial || {})); }
  get(k) { return this.map.get(k); }
  set(k, v) { this.map.set(k, v); }
  unset(k) { this.map.delete(k); }
  toObject() { return Object.fromEntries(this.map); }
}

/** Tạo đối tượng `pm` cho một lần chạy request. */
function makePm({ vars, response, logs, sendRequest }) {
  return {
    info: { requestName: response?.requestName || '' },
    variables: vars,
    collectionVariables: vars,
    environment: vars,
    globals: vars,
    response: response
      ? {
          code: response.code,
          status: response.status,
          responseTime: response.responseTime,
          headers: response.headers,
          text: () => response.body,
          json: () => JSON.parse(response.body),
          to: makeResponseChain(response, false)
        }
      : undefined,
    expect,
    test(name, fn) {
      try {
        fn();
        logs.push({ ok: true, name });
      } catch (e) {
        logs.push({ ok: false, name, error: e.message });
      }
    },
    sendRequest(opts) {
      return sendRequest(opts);
    }
  };
}

/** Gọi HTTP bằng fetch, trả về phản hồi đã chuẩn hoá. */
async function httpCall({ method, url, headers, body }) {
  const started = Date.now();
  const init = { method, headers: headers || {} };
  if (body !== undefined && body !== null && method !== 'GET' && method !== 'HEAD') {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, init);
  } catch (e) {
    return { code: 0, status: 'NETWORK_ERROR', body: '', headers: {}, responseTime: Date.now() - started };
  }
  const text = await res.text();
  const hdrs = {};
  res.headers.forEach((v, k) => { hdrs[k] = v; });
  return { code: res.status, status: res.statusText, body: text, headers: hdrs, responseTime: Date.now() - started };
}

// ==================================================================== Main ====
const collection = JSON.parse(fs.readFileSync(COLLECTION, 'utf8'));
const vars = new Variables();
for (const v of collection.variable || []) vars.set(v.key, v.value);
vars.set('baseUrl', API_BASE);

const results = [];   // { folder, name, code, ms, tests: [{ok,name,error}] }

/** Chạy một script trong ngữ cảnh pm. */
async function runScript(exec, pm, { allowAwait }) {
  const src = exec.join('\n');
  if (!src.trim()) return;
  if (allowAwait) {
    const fn = new Function('pm', `return (async () => {\n${src}\n})();`);
    await fn(pm);
  } else {
    const fn = new Function('pm', src);
    fn(pm);
  }
}

function resolveHeaders(req) {
  const h = {};
  for (const item of req.header || []) {
    h[substitute(item.key, vars)] = substitute(item.value, vars);
  }
  return h;
}

function buildUrl(req) {
  const raw = substitute(req.url.raw, vars);
  // Nếu raw đã là URL đầy đủ (đã thay {{baseUrl}}) thì dùng luôn
  return raw;
}

async function sendRequestFromOpts(opts) {
  const url = substitute(opts.url, vars);
  const headers = {};
  for (const [k, v] of Object.entries(opts.header || {})) headers[k] = substitute(String(v), vars);
  const raw = opts.body?.raw ?? opts.body;
  const res = await httpCall({ method: opts.method || 'GET', url, headers, body: raw });
  // Giống Postman: trả về đối tượng có .code, .json(), .text()
  return {
    code: res.code,
    status: res.status,
    responseTime: res.responseTime,
    headers: res.headers,
    text: () => res.body,
    json: () => JSON.parse(res.body)
  };
}

// ------------------------------------------- 1. Pre-request cấp bộ sưu tập ---
const collectionPre = (collection.event || []).find((e) => e.listen === 'prerequest');
if (collectionPre) {
  const preLogs = [];
  const pm = makePm({ vars, logs: preLogs, sendRequest: sendRequestFromOpts });
  try {
    await runScript(collectionPre.script.exec, pm, { allowAwait: true });
  } catch (e) {
    console.log('[LOI] Pre-request cap bo suu tap: ' + e.message);
  }
}

/** Ghép header của request với phần xác thực (auth) theo đúng cách Postman làm. */
function resolveHeadersWithAuth(req) {
  const h = resolveHeaders(req);

  // Postman tách "auth" khỏi "header". Request có auth riêng thì dùng auth đó,
  // không có thì kế thừa auth cấp bộ sưu tập.
  const auth = req.auth !== undefined ? req.auth : collection.auth;
  if (!auth || auth.type === 'noauth') return h;

  if (auth.type === 'bearer') {
    const entry = (auth.bearer || []).find((x) => x.key === 'token');
    const token = entry ? substitute(String(entry.value), vars) : '';
    if (token) h['Authorization'] = 'Bearer ' + token;
  }
  return h;
}

// --------------------------------------------------- 2. Duyệt và chạy --------
async function runItems(items, folderName) {
  for (const item of items) {
    if (item.item) {
      await runItems(item.item, folderName ? `${folderName} / ${item.name}` : item.name);
      continue;
    }

    const req = item.request;
    const logs = [];
    let response = null;

    const url = buildUrl(req);
    const headers = resolveHeadersWithAuth(req);
    let body;
    if (req.body?.raw !== undefined) {
      const raw = substitute(req.body.raw, vars);
      body = raw;
    }

    response = await httpCall({ method: req.method, url, headers, body });
    response.requestName = item.name;

    const pm = makePm({ vars, response, logs, sendRequest: sendRequestFromOpts });
    const testScript = (item.event || []).find((e) => e.listen === 'test');
    if (testScript) {
      try {
        await runScript(testScript.script.exec, pm, { allowAwait: false });
      } catch (e) {
        logs.push({ ok: false, name: 'Loi chay script', error: e.message });
      }
    }

    results.push({
      folder: folderName,
      name: item.name,
      code: response.code,
      ms: response.responseTime,
      tests: logs
    });
  }
}

console.log('');
console.log('===============================================================');
console.log('   CHAY BO SUU TAP POSTMAN (mo phong Newman)');
console.log('===============================================================');
console.log('   API : ' + API_BASE);
console.log('   File: ' + path.basename(COLLECTION));
console.log('');

await runItems(collection.item, '');

// ------------------------------------------------------- 3. Tổng hợp ---------
let nTest = 0, nFail = 0, nReq = 0;
const failed = [];

for (const r of results) {
  nReq++;
  const bad = r.tests.filter((t) => !t.ok);
  nTest += r.tests.length;
  nFail += bad.length;
  if (bad.length) failed.push({ r, bad });
}

// In tiến trình theo từng folder
let lastFolder = null;
for (const r of results) {
  if (r.folder !== lastFolder) {
    lastFolder = r.folder;
    console.log('');
    console.log('--- ' + (r.folder || '(khong co folder)') + ' ---');
  }
  const bad = r.tests.filter((t) => !t.ok).length;
  const mark = bad ? 'X' : '.';
  const codeStr = String(r.code).padStart(3);
  console.log(`  ${mark} [${codeStr}] ${String(r.ms).padStart(5)}ms  ${r.name}`);
}

console.log('');
console.log('===============================================================');
console.log('   KET QUA');
console.log('===============================================================');
console.log('   Request da chay : ' + nReq);
console.log('   Kiem thu da chay: ' + nTest);
console.log('   Kiem thu dat    : ' + (nTest - nFail));
console.log('   Kiem thu hong   : ' + nFail);
if (nTest) console.log('   Ty le dat       : ' + (((nTest - nFail) / nTest) * 100).toFixed(1) + '%');

// ------------------------------------------------- 4. Xuất báo cáo Markdown --
const REPORT = process.env.REPORT_POSTMAN
  || path.join(__dirname, 'KET_QUA_POSTMAN.md');

{
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // Gom theo folder
  const byFolder = [];
  for (const r of results) {
    const key = r.folder || '(không có folder)';
    let g = byFolder.find((x) => x.name === key);
    if (!g) { g = { name: key, reqs: 0, tests: 0, fail: 0 }; byFolder.push(g); }
    g.reqs++;
    g.tests += r.tests.length;
    g.fail += r.tests.filter((t) => !t.ok).length;
  }

  const L = [];
  L.push('# Kết quả chạy bộ sưu tập Postman');
  L.push('');
  L.push('Báo cáo được sinh tự động bởi `tests/run-postman.mjs`.');
  L.push('');
  L.push(`- **Thời điểm chạy:** ${stamp}`);
  L.push(`- **Địa chỉ API:** \`${API_BASE}\``);
  L.push('- **Bộ sưu tập:** `tests/KIMDONG_API.postman_collection.json`');
  L.push(`- **Số folder:** ${byFolder.length}`);
  L.push(`- **Số request:** ${nReq}`);
  L.push(`- **Số kiểm tra:** ${nTest}`);
  L.push('');
  L.push('## 1. Tổng hợp');
  L.push('');
  L.push('| Chỉ số | Giá trị |');
  L.push('| --- | --- |');
  L.push(`| Kiểm tra đã chạy | ${nTest} |`);
  L.push(`| Đạt | ${nTest - nFail} |`);
  L.push(`| Không đạt | ${nFail} |`);
  L.push(`| Tỷ lệ đạt | ${nTest ? (((nTest - nFail) / nTest) * 100).toFixed(1) : '0.0'}% |`);
  L.push('');
  L.push('## 2. Kết quả theo nhóm chức năng');
  L.push('');
  L.push('| Nhóm chức năng | Request | Kiểm tra | Đạt | Không đạt | Kết luận |');
  L.push('| --- | ---: | ---: | ---: | ---: | --- |');
  for (const g of byFolder) {
    L.push(`| ${g.name} | ${g.reqs} | ${g.tests} | ${g.tests - g.fail} | ${g.fail} | ${g.fail ? '**KHÔNG ĐẠT**' : 'Đạt'} |`);
  }
  L.push('');
  L.push('## 3. Chi tiết từng kiểm tra');
  L.push('');
  for (const g of byFolder) {
    L.push(`### ${g.name}`);
    L.push('');
    L.push('| Request | HTTP | Thời gian | Kiểm tra | Kết quả |');
    L.push('| --- | ---: | ---: | ---: | --- |');
    for (const r of results.filter((x) => (x.folder || '(không có folder)') === g.name)) {
      const bad = r.tests.filter((t) => !t.ok).length;
      L.push(`| ${r.name} | ${r.code} | ${r.ms} ms | ${r.tests.length} | ${bad ? `**${bad} lỗi**` : 'Đạt'} |`);
    }
    L.push('');
  }

  if (failed.length) {
    L.push('## 4. Danh sách kiểm tra không đạt');
    L.push('');
    for (const { r, bad } of failed) {
      L.push(`### ${r.name} — HTTP ${r.code}`);
      L.push('');
      for (const b of bad) {
        L.push(`- **${b.name}**: ${b.error}`);
      }
      L.push('');
    }
  } else {
    L.push('## 4. Danh sách kiểm tra không đạt');
    L.push('');
    L.push('Không có kiểm tra nào không đạt.');
    L.push('');
  }

  L.push('---');
  L.push('');
  L.push('*Bộ kiểm thử tự động đầy đủ (253 test case) nằm ở `tests/api-tests.mjs`.*');
  L.push('');

  fs.writeFileSync(REPORT, L.join('\n'), 'utf8');
  console.log('');
  console.log('   [BAO CAO] Da xuat: ' + REPORT);
}

if (failed.length) {
  console.log('');
  console.log('---------------------------------------------------------------');
  console.log('   CHI TIET CAC KIEM THU KHONG DAT');
  console.log('---------------------------------------------------------------');
  for (const { r, bad } of failed) {
    console.log('');
    console.log(`  ${r.name}   [HTTP ${r.code}]`);
    for (const b of bad) {
      console.log(`     - ${b.name}`);
      console.log(`       ${b.error}`);
    }
  }
}

console.log('');
process.exit(nFail === 0 ? 0 : 1);
