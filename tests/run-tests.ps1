#Requires -Version 5.1
<#
.SYNOPSIS
    Chạy toàn bộ bộ kiểm thử API: khôi phục DB kiểm thử -> bật server riêng -> chạy test -> tắt server.

.DESCRIPTION
    Script này đảm bảo kiểm thử chạy trong môi trường CÔ LẬP:
      - Dùng database riêng  : kimdong_bookstore_test
      - Dùng cổng riêng      : 5099  (không đụng tới server dev ở cổng 5000)
    Nhờ vậy có thể chạy kiểm thử trong khi vẫn đang phát triển bình thường,
    và không làm hỏng dữ liệu demo.

.PARAMETER Port
    Cổng cho server kiểm thử. Mặc định 5099.

.PARAMETER DbName
    Tên database kiểm thử. Mặc định kimdong_bookstore_test.

.PARAMETER SkipReset
    Bỏ qua bước khôi phục database (dùng khi muốn chạy lại nhanh).

.PARAMETER Report
    Đường dẫn file báo cáo đầu ra.

.PARAMETER Runner
    Bộ kiểm thử sẽ chạy:
      api-tests.mjs   (mặc định) bộ 253 test case viết bằng Node
      run-postman.mjs            chạy bộ sưu tập Postman (mô phỏng Newman)
      unit-tests.mjs             kiểm thử đơn vị (không cần server, không cần MySQL)
      both                       chạy lần lượt api-tests.mjs và run-postman.mjs

.EXAMPLE
    .\run-tests.ps1
    .\run-tests.ps1 -Port 5099
    .\run-tests.ps1 -SkipReset
    .\run-tests.ps1 -Runner run-postman.mjs
    .\run-tests.ps1 -Runner unit-tests.mjs
    .\run-tests.ps1 -Runner both
#>
param(
    [int]$Port        = 5099,
    [string]$DbName   = 'kimdong_bookstore_test',
    [switch]$SkipReset,
    [string]$Report,
    [string]$Runner   = 'api-tests.mjs'
)

$ErrorActionPreference = 'Stop'

$TestsDir = $PSScriptRoot
$Root     = Resolve-Path (Join-Path $TestsDir '..')
$ServerDir = Join-Path $Root 'server'

if (-not $Report) { $Report = Join-Path $TestsDir 'KET_QUA_KIEM_THU.md' }

# ------------------------------------------- Kiểm thử đơn vị (chạy riêng) ---
# Kiểm thử đơn vị chỉ gọi hàm trực tiếp trong bộ nhớ: không cần MySQL, không cần
# khởi động server. Vì vậy chạy riêng một nhánh để nhanh và không phụ thuộc gì.
if ($Runner -eq 'unit-tests.mjs') {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "   KIỂM THỬ ĐƠN VỊ - WEBSITE BÁN SÁCH NXB KIM ĐỒNG" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Không cần MySQL, không cần khởi động server." -ForegroundColor DarkGray
    Write-Host ""
    & node (Join-Path $TestsDir 'unit-tests.mjs')
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   BỘ KIỂM THỬ API - WEBSITE BÁN SÁCH NXB KIM ĐỒNG" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ---------------------------------------------------- 1. Khôi phục DB ------
if (-not $SkipReset) {
    Write-Host "[1/4] Khôi phục database kiểm thử..." -ForegroundColor Yellow
    & (Join-Path $TestsDir 'reset-test-db.ps1') -DbName $DbName
    if ($LASTEXITCODE -ne 0) { throw "Khong khoi phuc duoc database kiem thu" }
} else {
    Write-Host "[1/4] Bỏ qua khôi phục database (-SkipReset)" -ForegroundColor DarkGray
}

# ------------------------------------------------- 2. Biên dịch server -----
Write-Host ""
Write-Host "[2/4] Biên dịch backend (TypeScript -> JavaScript)..." -ForegroundColor Yellow
Push-Location $ServerDir
try {
    & npx tsc
    if ($LASTEXITCODE -ne 0) { throw "Bien dich that bai (npx tsc)" }
} finally {
    Pop-Location
}
$Entry = Join-Path $ServerDir 'dist\index.js'
if (-not (Test-Path $Entry)) { throw "Khong tim thay $Entry sau khi bien dich" }

# ---------------------------------------------------- 3. Bật server -------
Write-Host ""
Write-Host "[3/4] Khởi động server kiểm thử (cổng $Port, DB $DbName)..." -ForegroundColor Yellow

$env:PORT = "$Port"
$env:DB_NAME = $DbName
$env:NODE_ENV = 'test'

$logOut = Join-Path $TestsDir 'server-test.log'
$logErr = Join-Path $TestsDir 'server-test.err.log'

$proc = Start-Process -FilePath "node" -ArgumentList "dist/index.js" `
    -WorkingDirectory $ServerDir -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput $logOut -RedirectStandardError $logErr

# Chờ server sẵn sàng (tối đa 40 giây)
$ready = $false
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$Port/api/books" -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
    if ($proc.HasExited) { break }
}

if (-not $ready) {
    if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
    Write-Host "Server kiem thu khong khoi dong duoc. Nhat ky loi:" -ForegroundColor Red
    if (Test-Path $logErr) { Get-Content $logErr | Select-Object -Last 20 }
    if (Test-Path $logOut) { Get-Content $logOut | Select-Object -Last 20 }
    throw "Khong khoi dong duoc server kiem thu"
}

Write-Host "      -> Server sẵn sàng tại http://localhost:$Port" -ForegroundColor Green

# ---------------------------------------------------- 4. Chạy test --------
Write-Host ""
Write-Host "[4/4] Chạy bộ kiểm thử..." -ForegroundColor Yellow
Write-Host ""

$env:API_BASE = "http://localhost:$Port/api"
$env:REPORT = $Report

$exitCode = 0
try {
    $runners = switch ($Runner) {
        'both'            { @('api-tests.mjs', 'run-postman.mjs') }
        'run-postman.mjs' { @('run-postman.mjs') }
        default           { @($Runner) }
    }

    foreach ($r in $runners) {
        $script = Join-Path $TestsDir $r
        if (-not (Test-Path $script)) { throw "Khong tim thay bo kiem thu: $script" }
        Write-Host "--- Bo kiem thu: $r ---" -ForegroundColor Cyan
        & node $script
        if ($LASTEXITCODE -ne 0) { $exitCode = $LASTEXITCODE }
        Write-Host ""
    }
} finally {
    Write-Host ""
    Write-Host "Đang tắt server kiểm thử..." -ForegroundColor DarkGray
    if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
    # Dọn biến môi trường để không ảnh hưởng terminal hiện tại
    Remove-Item Env:\PORT, Env:\DB_NAME, Env:\API_BASE, Env:\REPORT -ErrorAction SilentlyContinue
}

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "HOÀN TẤT: toàn bộ test case đạt." -ForegroundColor Green
} else {
    Write-Host "HOÀN TẤT: có test case không đạt (mã thoát $exitCode)." -ForegroundColor Red
}
Write-Host "Báo cáo: $Report" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
