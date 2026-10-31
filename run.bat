@echo off
rem Serve the static site locally and open it in the default browser.
cd /d "%~dp0"
set PORT=8000
echo Serving the app at http://localhost:%PORT%
echo Close this window or press Ctrl+C to stop.
start "" http://localhost:%PORT%
python -m http.server %PORT%
if errorlevel 1 (
  echo.
  echo Could not start the server. Make sure Python is installed and on PATH,
  echo and that nothing else is already using port %PORT%.
  pause
)
