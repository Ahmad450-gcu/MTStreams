$ErrorActionPreference = "Stop"
$obsoletePage = Join-Path $PSScriptRoot "src\Components\pages\People\PeoplePage.jsx"
if (Test-Path -LiteralPath $obsoletePage) {
    Remove-Item -LiteralPath $obsoletePage -Force
    Write-Host "Removed the dedicated People browse page component." -ForegroundColor Green
} else {
    Write-Host "The dedicated People browse page component is already absent." -ForegroundColor Yellow
}
