@echo off
title ED-python/bash
cd /d "%~dp0"

echo ============================================
echo   ED-python/bash - by ED-Dev
echo ============================================
echo.

if not exist "dist\index.html" (
    echo No hay build de produccion. Construyendo...
    call npm run build
    if errorlevel 1 (
        echo Error en el build. Abortando.
        pause
        exit /b 1
    )
)

echo Iniciando servidor de produccion...
echo.

start "" http://localhost:4173/
npm run preview -- --port 4173 --host

pause
