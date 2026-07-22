@echo off
setlocal
cd /d "%~dp0.."
call npx.cmd tsx scripts\sync-editor-assets.ts
if errorlevel 1 (
  echo.
  echo Editor asset sync failed.
  exit /b 1
)
echo.
echo Editor asset sync completed.
endlocal
