#requires -Version 5.1
<#
.SYNOPSIS
    Создание резервной копии базы данных PostgreSQL для Электронного журнала.
.DESCRIPTION
    Читает параметры подключения из server/.env и запускает pg_dump.
    Бэкап сохраняется в папку backups/ с меткой времени.
#>

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvPath = Join-Path $ProjectRoot "server\.env"
$BackupDir = Join-Path $ProjectRoot "backups"

if (-not (Test-Path $EnvPath)) {
    Write-Host "ОШИБКА: Не найден файл $EnvPath" -ForegroundColor Red
    exit 1
}

$envVars = @{}
Get-Content $EnvPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#')) {
        $parts = $line.Split('=', 2)
        if ($parts.Count -eq 2) {
            $envVars[$parts[0].Trim()] = $parts[1].Trim()
        }
    }
}

$DbHost     = if ($envVars['DB_HOST']) { $envVars['DB_HOST'] } else { 'localhost' }
$DbPort     = if ($envVars['DB_PORT']) { $envVars['DB_PORT'] } else { '5432' }
$DbName     = $envVars['DB_NAME']
$DbUser     = $envVars['DB_USER']
$DbPass     = $envVars['DB_PASSWORD']

if (-not $DbName -or -not $DbUser) {
    Write-Host "ОШИБКА: Не удалось прочитать DB_NAME или DB_USER из .env" -ForegroundColor Red
    exit 1
}

$PgDumpPath = $null
$cmd = Get-Command pg_dump -ErrorAction SilentlyContinue
if ($cmd) {
    $PgDumpPath = $cmd.Source
}
if (-not $PgDumpPath) {
    $PossiblePaths = @(
        "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
    )
    foreach ($p in $PossiblePaths) {
        if (Test-Path $p) {
            $PgDumpPath = $p
            break
        }
    }
}

if (-not $PgDumpPath) {
    Write-Host "ОШИБКА: pg_dump не найден. Установите PostgreSQL и добавьте bin в PATH." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "backup_${DbName}_${Timestamp}.sql"

Write-Host "Создание резервной копии базы '$DbName'..." -ForegroundColor Yellow

$env:PGPASSWORD = $DbPass
& $PgDumpPath -h $DbHost -p $DbPort -U $DbUser -F p -f $BackupFile $DbName
if ($LASTEXITCODE -ne 0) {
    Write-Host "ОШИБКА: pg_dump завершился с кодом $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

$size = (Get-Item $BackupFile).Length
$sizeStr = if ($size -gt 1MB) { "{0:N2} MB" -f ($size / 1MB) } else { "{0:N2} KB" -f ($size / 1KB) }
Write-Host "УСПЕХ: Бэкап создан ($sizeStr)" -ForegroundColor Green
Write-Host "Путь: $BackupFile" -ForegroundColor Green

$old = Get-ChildItem $BackupDir -Filter "*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }
if ($old) {
    Write-Host "ВНИМАНИЕ: Найдены копии старше 30 дней ($($old.Count) шт.)" -ForegroundColor Yellow
}