# Режим разработки: бэкенд и фронтенд параллельно
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; dotnet run --urls 'http://0.0.0.0:5000'" -PassThru
Start-Sleep 3
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm install; npm run dev" -PassThru

Write-Host "Бэкенд PID: $($backend.Id)" -ForegroundColor Green
Write-Host "Фронтенд PID: $($frontend.Id)" -ForegroundColor Green
Write-Host "Открой http://localhost:5173 в браузере" -ForegroundColor Yellow
