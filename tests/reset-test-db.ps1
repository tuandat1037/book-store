#Requires -Version 5.1
<#
.SYNOPSIS
    Khôi phục database kiểm thử về trạng thái ban đầu (schema + dữ liệu mẫu).

.DESCRIPTION
    ⚠️ LƯU Ý QUAN TRỌNG — ĐÃ TỪNG GÂY SỰ CỐ:
    Hai file database/schema.sql và database/seed.sql đều chứa lệnh
        USE `kimdong_bookstore`;
    Lệnh này sẽ GHI ĐÈ tham số -D trên dòng lệnh. Nếu nạp trực tiếp bằng
        mysql -D kimdong_bookstore_test < schema.sql
    thì toàn bộ bảng và dữ liệu sẽ bị ghi nhầm vào DATABASE CHÍNH,
    làm hỏng dữ liệu demo (đã từng xảy ra: books 12 -> 17, orders 2 -> 3).

    Script này loại bỏ các dòng CREATE DATABASE / USE trước khi nạp,
    sau đó mới trỏ tường minh vào database kiểm thử bằng tham số -D.

.PARAMETER DbName
    Tên database kiểm thử. Mặc định: kimdong_bookstore_test

.PARAMETER MysqlBin
    Đường dẫn mysql.exe. Mặc định theo XAMPP.

.EXAMPLE
    .\reset-test-db.ps1
    .\reset-test-db.ps1 -DbName kimdong_bookstore_test
#>
param(
    [string]$DbName   = 'kimdong_bookstore_test',
    [string]$MysqlBin = ''
)

$ErrorActionPreference = 'Stop'

# Tự động tìm mysql.exe nếu không truyền vào
if (-not $MysqlBin) {
    $candidates = @(
        'C:\xampp\mysql\bin\mysql.exe',
        'D:\xampp\mysql\bin\mysql.exe',
        'E:\xampp\mysql\bin\mysql.exe',
        'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $MysqlBin = $c; break }
    }
    if (-not $MysqlBin) {
        $cmd = Get-Command mysql.exe -ErrorAction SilentlyContinue
        if ($cmd) { $MysqlBin = $cmd.Source }
    }
}

# Thư mục gốc dự án (script nằm trong tests/)
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')

$schemaPath = Join-Path $Root 'database\schema.sql'
$seedPath   = Join-Path $Root 'database\seed.sql'

foreach ($f in @($schemaPath, $seedPath)) {
    if (-not (Test-Path $f)) { throw "Khong tim thay file: $f" }
}

function Remove-DbRedirect {
    param([string]$Sql)
    # Bo dong CREATE DATABASE ...;
    $Sql = $Sql -replace '(?im)^\s*CREATE\s+DATABASE[^;]*;\s*$', ''
    # Bo dong USE `...`;
    $Sql = $Sql -replace '(?im)^\s*USE\s+`?[\w]+`?\s*;\s*$', ''
    return $Sql
}

Write-Host "==> Tao lai database kiem thu: $DbName" -ForegroundColor Cyan
& $MysqlBin -u root -e "DROP DATABASE IF EXISTS ``$DbName``; CREATE DATABASE ``$DbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if ($LASTEXITCODE -ne 0) { throw "Khong tao duoc database $DbName" }

Write-Host "==> Nap schema.sql" -ForegroundColor Cyan
$schema = Remove-DbRedirect (Get-Content $schemaPath -Raw -Encoding UTF8)
$schema | & $MysqlBin -u root --default-character-set=utf8mb4 -D $DbName
if ($LASTEXITCODE -ne 0) { throw "Nap schema.sql that bai" }

Write-Host "==> Nap seed.sql" -ForegroundColor Cyan
$seed = Remove-DbRedirect (Get-Content $seedPath -Raw -Encoding UTF8)
$seed | & $MysqlBin -u root --default-character-set=utf8mb4 -D $DbName
if ($LASTEXITCODE -ne 0) { throw "Nap seed.sql that bai" }

Write-Host "==> Kiem tra du lieu" -ForegroundColor Cyan
& $MysqlBin -u root --default-character-set=utf8mb4 -D $DbName -e @"
SELECT 'books' AS bang, COUNT(*) AS so_dong FROM books
UNION ALL SELECT 'users',        COUNT(*) FROM users
UNION ALL SELECT 'orders',       COUNT(*) FROM orders
UNION ALL SELECT 'order_items',  COUNT(*) FROM order_items
UNION ALL SELECT 'reviews',      COUNT(*) FROM reviews
UNION ALL SELECT 'categories',   COUNT(*) FROM categories
UNION ALL SELECT 'promotions',   COUNT(*) FROM promotions
UNION ALL SELECT 'banners',      COUNT(*) FROM banners;
"@

Write-Host "==> Xong. Database '$DbName' da san sang." -ForegroundColor Green
