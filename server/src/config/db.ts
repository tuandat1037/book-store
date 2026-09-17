import mysql from 'mysql2/promise';

/**
 * Kết nối cơ sở dữ liệu MySQL.
 *
 * Hệ thống CHỈ dùng MySQL. Trước đây file này có thêm một "chế độ dự phòng"
 * dùng dữ liệu cứng trong file kimdong_data.json: khi không kết nối được MySQL,
 * server tự chuyển sang đọc file đó và vẫn chạy bình thường. Cơ chế này gây ra
 * lỗi rất khó phát hiện — web vẫn hiện sách và vẫn đăng nhập được, nhưng dữ liệu
 * KHÔNG đến từ database, và mọi thay đổi đều không được lưu vào MySQL.
 *
 * Vì vậy chế độ dự phòng đã bị loại bỏ hoàn toàn. Nếu không kết nối được MySQL,
 * server sẽ báo lỗi rõ ràng và dừng lại, để không ai bị nhầm lẫn nữa.
 */

let mysqlPool: mysql.Pool | null = null;

/** Thông tin kết nối, giữ lại để in ra khi khởi động. */
let connectionInfo = { host: '', port: 0, user: '', database: '' };

/**
 * Khởi tạo kết nối database.
 * Ném lỗi nếu không kết nối được — server sẽ dừng thay vì chạy bằng dữ liệu giả.
 */
export async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'kimdong_bookstore';

  connectionInfo = { host, port, user, database };

  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  });

  // Kiểm tra kết nối thật sự trước khi coi như thành công
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();

  mysqlPool = pool;
  console.log(`Đã kết nối MySQL: ${user}@${host}:${port}/${database}`);
}

/** Thông tin kết nối hiện tại, dùng cho endpoint /api/health. */
export function getDatabaseInfo() {
  return {
    engine: 'MySQL',
    ...connectionInfo,
    connected: mysqlPool !== null
  };
}

/** Lấy pool đang dùng, báo lỗi nếu chưa khởi tạo. */
function getPool(): mysql.Pool {
  if (!mysqlPool) {
    throw new Error(
      'Chưa kết nối được cơ sở dữ liệu. Hãy kiểm tra MySQL đã chạy chưa và ' +
      'thông tin kết nối trong file server/.env.'
    );
  }
  return mysqlPool;
}

/** Thực thi câu lệnh SQL, trả về danh sách bản ghi. */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params);
  return rows as T[];
}

/** Thực thi câu lệnh SQL, trả về bản ghi đầu tiên hoặc null. */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/** Đóng pool sau khi test xong để Vitest không bị treo. */
export async function closeDatabase() {
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
  }
}

/**
 * In hướng dẫn xử lý khi không kết nối được MySQL.
 * Gọi từ index.ts để thông báo lỗi dễ hiểu thay vì chỉ hiện stack trace.
 */
export function printConnectionHelp(error: any) {
  const { host, port, user, database } = connectionInfo;
  const code = error?.code || '';

  console.error('');
  console.error('================================================================');
  console.error('   KHÔNG KẾT NỐI ĐƯỢC CƠ SỞ DỮ LIỆU MYSQL');
  console.error('================================================================');
  console.error('');
  console.error(`   Đã thử kết nối: ${user}@${host}:${port}/${database}`);
  console.error(`   Mã lỗi       : ${code || '(không xác định)'}`);
  console.error('');

  if (code === 'ECONNREFUSED') {
    console.error('   NGUYÊN NHÂN: MySQL chưa chạy.');
    console.error('');
    console.error('   CÁCH SỬA:');
    console.error('     - Nếu dùng XAMPP: mở XAMPP Control Panel, bấm Start ở dòng MySQL.');
    console.error('     - Hoặc chạy lệnh:');
    console.error('         Start-Process "D:\\xampp\\mysql\\bin\\mysqld.exe" `');
    console.error('           -ArgumentList "--defaults-file=D:\\xampp\\mysql\\bin\\my.ini","--standalone"');
  } else if (code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('   NGUYÊN NHÂN: Sai tài khoản hoặc mật khẩu MySQL.');
    console.error('');
    console.error('   CÁCH SỬA: mở file server/.env và sửa lại DB_USER / DB_PASSWORD.');
  } else if (code === 'ER_BAD_DB_ERROR') {
    console.error(`   NGUYÊN NHÂN: Chưa có database tên "${database}".`);
    console.error('');
    console.error('   CÁCH SỬA: nạp cấu trúc và dữ liệu mẫu:');
    console.error('         cd tests');
    console.error('         .\\reset-test-db.ps1 -DbName ' + database);
  } else {
    console.error('   CÁCH SỬA: kiểm tra MySQL đã chạy chưa và thông tin kết nối trong server/.env.');
  }

  console.error('');
  console.error('   LƯU Ý: Server cố tình DỪNG lại thay vì chạy bằng dữ liệu giả.');
  console.error('   Trước đây hệ thống tự chuyển sang file kimdong_data.json khi mất kết nối,');
  console.error('   khiến web vẫn hiện sách nhưng dữ liệu không đến từ database.');
  console.error('');
  console.error('================================================================');
  console.error('');
}
