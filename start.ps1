Set-Location "$PSScriptRoot\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "Устанавливаем зависимости npm..." -ForegroundColor Cyan
    npm install
}

Write-Host "Собираем фронтенд..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Ошибка сборки фронтенда" -ForegroundColor Red
    exit 1
}

Set-Location "$PSScriptRoot\backend"
Write-Host "Сервер запущен: http://localhost:5000" -ForegroundColor Green
dotnet run --urls http://0.0.0.0:5000
