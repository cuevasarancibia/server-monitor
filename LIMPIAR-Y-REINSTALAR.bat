@echo off
echo ════════════════════════════════════════════════════════════════
echo   LIMPIEZA Y REINSTALACION AUTOMATICA
echo ════════════════════════════════════════════════════════════════
echo.

echo [1/4] Deteniendo procesos en puerto 3000...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000') DO (
    echo Cerrando proceso %%P
    taskkill /PID %%P /F >nul 2>&1
)
echo     ✓ Procesos detenidos
echo.

echo [2/4] Borrando carpeta .next...
if exist .next (
    rmdir /s /q .next
    echo     ✓ .next borrado
) else (
    echo     - .next no existe (ok)
)
echo.

echo [3/4] Borrando carpeta node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo     ✓ node_modules borrado (esto puede tomar un momento)
) else (
    echo     - node_modules no existe (ok)
)
echo.

echo [4/4] Instalando dependencias limpias...
call npm install
if %errorlevel% neq 0 (
    echo     ✗ Error al instalar dependencias
    echo     Intenta manualmente: npm install
    pause
    exit /b 1
)
echo     ✓ Dependencias instaladas
echo.

echo ════════════════════════════════════════════════════════════════
echo   LISTO! Ahora ejecuta:  npm run dev
echo ════════════════════════════════════════════════════════════════
echo.
pause
