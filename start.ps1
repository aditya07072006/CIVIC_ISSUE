# Start Flask Backend
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Civic Issue Portal Startup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "`n[1/2] Starting Flask Backend (port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'C:\Users\adity\OneDrive\Desktop\CIVIC_ISSUE\backend'; python app.py"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting React Frontend (port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'C:\Users\adity\OneDrive\Desktop\CIVIC_ISSUE\frontend'; npm run dev"

Start-Sleep -Seconds 3

Write-Host "`n==================================" -ForegroundColor Green
Write-Host "  Both servers started!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "  Admin Login:" -ForegroundColor Gray
Write-Host "  Email:    admin@civic.gov" -ForegroundColor Gray
Write-Host "  Password: Admin@123" -ForegroundColor Gray
Write-Host "==================================" -ForegroundColor Green
