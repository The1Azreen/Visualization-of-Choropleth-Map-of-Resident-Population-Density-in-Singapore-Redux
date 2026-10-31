$ErrorActionPreference = "Stop"
$port = 8000
Write-Host "Serving the app at http://localhost:$port"
Write-Host "Press Ctrl+C to stop."
python -m http.server $port
