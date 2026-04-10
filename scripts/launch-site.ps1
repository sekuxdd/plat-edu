$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "[EduPlatforma] Przygotowanie bazy danych..." -ForegroundColor Cyan
npm run db:push | Out-Host
npm run db:seed | Out-Host

$localIp = (Get-NetIPAddress -AddressFamily IPv4 |
	Where-Object { $_.IPAddress -notlike "169.254.*" -and $_.IPAddress -ne "127.0.0.1" } |
	Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $localIp) {
	throw "Nie udalo sie wykryc lokalnego adresu IP."
}

$appUrl = "http://$localIp`:3000"
Write-Host "[EduPlatforma] Adres aplikacji: $appUrl" -ForegroundColor Yellow
Write-Host "[EduPlatforma] Otwieram przegladarke pod adresem LAN..." -ForegroundColor Cyan
Start-Process $appUrl

Write-Host "[EduPlatforma] Buduje aplikacje (tryb produkcyjny pod LAN)..." -ForegroundColor Cyan
npm run build | Out-Host

Write-Host "[EduPlatforma] Uruchamiam serwer produkcyjny na $localIp`:3000..." -ForegroundColor Green
npm run start -- --hostname $localIp --port 3000
