@echo off
echo.
echo 🧪 Ejecutando Pruebas de Login - Embajada del Peru en Japon
echo ========================================================
echo.

cd /d "%~dp0\.."

echo 📋 Ejecutando todas las pruebas...
node __tests__/run-all-tests.js

echo.
echo 📄 Para ver el reporte detallado, abre:
echo    __tests__/test-report.md
echo.
pause