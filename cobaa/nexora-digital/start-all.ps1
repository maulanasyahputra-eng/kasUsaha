# ============================================================
#  NEXORA DIGITAL - START SEMUA SERVIS (Windows)
#  Jalankan: klik kanan file ini > Run with PowerShell
#  atau dari terminal: powershell -ExecutionPolicy Bypass -File start-all.ps1
# ============================================================

$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot
$mysqlBin = 'C:\Program Files\MySQL\MySQL Server 8.4\bin'

Write-Host "== 1/4 MySQL ==" -ForegroundColor Cyan
$t = Test-NetConnection localhost -Port 3306 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $t) {
  if (-not (Test-Path "$root\mysql-data")) {
    Write-Host "  Inisialisasi database pertama kali..."
    & "$mysqlBin\mysqld.exe" --initialize-insecure --basedir="$mysqlBin\.." --datadir="$root\mysql-data"
  }
  Write-Host "  Menjalankan MySQL (root tanpa password - DEV ONLY)..."
  Start-Process "$mysqlBin\mysqld.exe" -ArgumentList "--basedir=`"C:\Program Files\MySQL\MySQL Server 8.4`"", "--datadir=`"$root\mysql-data`"", "--port=3306" -WindowStyle Hidden
  Start-Sleep 5
  & "$mysqlBin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS nexora CHARACTER SET utf8mb4; CREATE DATABASE IF NOT EXISTS nexora_test CHARACTER SET utf8mb4;" 2>$null
} else { Write-Host "  MySQL sudah jalan." }
Write-Host "  MySQL OK" -ForegroundColor Green

Write-Host "== 2/4 Backend API (port 5000) ==" -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$root\backend'; npm run dev" -WindowStyle Minimized

Write-Host "== 3/4 Order Worker ==" -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$root\backend'; npm run worker" -WindowStyle Minimized

Write-Host "== 4/4 Frontend (port 5173) ==" -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$root\frontend'; npm run dev" -WindowStyle Minimized

Write-Host ""
Write-Host "Menunggu servis siap..." -ForegroundColor Yellow
Start-Sleep 12

try { Invoke-RestMethod http://localhost:5000/api/health | Out-Null; Write-Host "API    : http://localhost:5000  [UP]" -ForegroundColor Green }
catch { Write-Host "API    : belum siap, tunggu beberapa detik lalu cek jendela backend" -ForegroundColor Yellow }
Write-Host "WEB    : http://localhost:5173  <- buka di browser" -ForegroundColor Green
Write-Host ""
Write-Host "Akun dev: admin@nexora.test / ChangeMe_Now!2026 (admin)"
Write-Host "         demo@nexora.test  / Demo1234!         (customer)"
Start-Process "http://localhost:5173"
