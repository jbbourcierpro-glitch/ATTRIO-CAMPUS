@echo off
setlocal

cd /d "%~dp0Projet ATTRIO CAMPUS"

where npm >nul 2>nul
if errorlevel 1 (
  echo npm est introuvable sur ce PC.
  echo Installe Node.js puis relance ce fichier :
  echo https://nodejs.org/
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installation des dependances...
  call npm install
  if errorlevel 1 (
    echo.
    pause
    exit /b 1
  )
)

echo Demarrage d'ATTRIO CAMPUS...
call npm run desktop:start

echo.
pause
