#requires -Version 5.1
<#
.SYNOPSIS
    Восстановление базы данных PostgreSQL для Электронного журнала из резервной копии.
.DESCRIPTION
    Читает параметры подключения из server/.env и запускает psql для восстановления.
    Перед восстановлением создается бэкап текущей БД на всякий случай.
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

$DbHost = if ($envVars['DB_HOST']) { $envVars['DB_HOST'] } else { 'localhost' }
$DbPort = if ($envVars['DB_PORT']) { $envVars['DB_PORT'] } else { '5432' }
$DbName = $envVars['DB_NAME']
$DbUser = $envVars['DB_USER']
$DbPass = $envVars['DB_PASSWORD']

if (-not $DbName -or -not $DbUser) {
    Write-Host "ОШИБКА: Не удалось прочитать DB_NAME или DB_USER из .env" -ForegroundColor Red
    exit 1
}

function Find-Tool($toolName) {
    $path = $null
    $cmd = Get-Command $toolName -ErrorAction SilentlyContinue
    if ($cmd) { $path = $cmd.Source }
    if (-not $path) {
        $PossiblePaths = @(
            "C:\Program Files\PostgreSQL\18\bin\$toolName",
            "C:\Program Files\PostgreSQL\17\bin\$toolName",
            "C:\Program Files\PostgreSQL\16\bin\$toolName",
            "C:\Program Files\PostgreSQL\15\bin\$toolName"
        )
        foreach ($p in $PossiblePaths) {
            if (Test-Path $p) { $path = $p; break }
        }
    }
    return $path
}

$PsqlPath    = Find-Tool 'psql.exe'
$PgDumpPath  = Find-Tool 'pg_dump.exe'
$DropDbPath  = Find-Tool 'dropdb.exe'
$CreateDbPath = Find-Tool 'createdb.exe'

if (-not $PsqlPath) {
    Write-Host "ОШИБКА: psql не найден. Установите PostgreSQL и добавьте bin в PATH." -ForegroundColor Red
    exit 1
}
if (-not $DropDbPath -or -not $CreateDbPath) {
    Write-Host "ОШИБКА: dropdb/createdb не найдены. Установите PostgreSQL и добавьте bin в PATH." -ForegroundColor Red
    exit 1
}

$backups = Get-ChildItem $BackupDir -Filter "*.sql" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
if (-not $backups) {
    Write-Host "ОШИБКА: В папке $BackupDir не найдено файлов .sql" -ForegroundColor Red
    exit 1
}

Write-Host "Доступные резервные копии:" -ForegroundColor Cyan
for ($i = 0; $i -lt $backups.Count; $i++) {
    $size = if ($backups[$i].Length -gt 1MB) { "{0:N1} MB" -f ($backups[$i].Length / 1MB) } else { "{0:N1} KB" -f ($backups[$i].Length / 1KB) }
    Write-Host "  [$($i+1)] $($backups[$i].Name)  ($size, $($backups[$i].LastWriteTime))"
}
Write-Host "  [0] Отмена"

$choice = Read-Host "Введите номер файла для восстановления"
if ($choice -eq '0') {
    Write-Host "Отменено." -ForegroundColor Yellow
    exit 0
}

$idx = [int]$choice - 1
if ($idx -lt 0 -or $idx -ge $backups.Count) {
    Write-Host "ОШИБКА: Неверный номер." -ForegroundColor Red
    exit 1
}

$BackupFile = $backups[$idx].FullName

Write-Host ""
Write-Host "ВНИМАНИЕ: База '$DbName' будет ПЕРЕЗАПИСАНА из файла:" -ForegroundColor Magenta
Write-Host $BackupFile -ForegroundColor Magenta
$confirm = Read-Host "Введите YES для продолжения"
if ($confirm -ne 'YES') {
    Write-Host "Отменено." -ForegroundColor Yellow
    exit 0
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$PreBackup = Join-Path $BackupDir "pre_restore_${DbName}_${Timestamp}.sql"
Write-Host "Создание предварительного бэкапа текущей БД..." -ForegroundColor Yellow

$env:PGPASSWORD = $DbPass
& $PgDumpPath -h $DbHost -p $DbPort -U $DbUser -F p -f $PreBackup $DbName
if ($LASTEXITCODE -ne 0) {
    Write-Host "Предупреждение: не удалось создать предварительный бэкап (код $LASTEXITCODE)" -ForegroundColor Yellow
} else {
    Write-Host "Предварительный бэкап сохранен: $PreBackup" -ForegroundColor Green
}

Write-Host "Удаление базы '$DbName' (активные подключения будут разорваны)..." -ForegroundColor Yellow
$env:PGPASSWORD = $DbPass
& $DropDbPath --if-exists --force -h $DbHost -p $DbPort -U $DbUser $DbName
if ($LASTEXITCODE -ne 0) {
    Write-Host "ОШИБКА: Не удалось удалить базу (код $LASTEXITCODE)" -ForegroundColor Red
    exit 1
}

Write-Host "Создание базы '$DbName'..." -ForegroundColor Yellow
$env:PGPASSWORD = $DbPass
& $CreateDbPath -h $DbHost -p $DbPort -U $DbUser $DbName
if ($LASTEXITCODE -ne 0) {
    Write-Host "ОШИБКА: Не удалось создать базу (код $LASTEXITCODE)" -ForegroundColor Red
    exit 1
}

Write-Host "Восстановление данных из бэкапа..." -ForegroundColor Yellow
$env:PGPASSWORD = $DbPass
& $PsqlPath -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $BackupFile
if ($LASTEXITCODE -eq 0) {
    Write-Host "УСПЕХ: База '$DbName' восстановлена." -ForegroundColor Green
} else {
    Write-Host "ОШИБКА: Восстановление завершилось с кодом $LASTEXITCODE" -ForegroundColor Red
    exit 1
}