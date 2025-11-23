# Script de Limpieza y Reinstalación para Windows
# Ejecuta esto en PowerShell dentro de la carpeta del proyecto

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  LIMPIEZA Y REINSTALACION AUTOMATICA" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Detener procesos en puerto 3000
Write-Host "[1/4] Deteniendo procesos en puerto 3000..." -ForegroundColor Yellow
try {
    $processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($processes) {
        foreach ($proc in $processes) {
            Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
        }
        Write-Host "    ✓ Procesos detenidos" -ForegroundColor Green
    } else {
        Write-Host "    - No hay procesos en puerto 3000 (ok)" -ForegroundColor Gray
    }
} catch {
    Write-Host "    - No se pudo verificar puerto 3000 (ok)" -ForegroundColor Gray
}
Write-Host ""

# Paso 2: Borrar .next
Write-Host "[2/4] Borrando carpeta .next..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "    ✓ .next borrado" -ForegroundColor Green
} else {
    Write-Host "    - .next no existe (ok)" -ForegroundColor Gray
}
Write-Host ""

# Paso 3: Borrar node_modules
Write-Host "[3/4] Borrando carpeta node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "    Esto puede tomar un momento..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "    ✓ node_modules borrado" -ForegroundColor Green
} else {
    Write-Host "    - node_modules no existe (ok)" -ForegroundColor Gray
}
Write-Host ""

# Paso 4: Instalar dependencias
Write-Host "[4/4] Instalando dependencias limpias..." -ForegroundColor Yellow
Write-Host "    Esto tomará 1-2 minutos..." -ForegroundColor Gray
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✓ Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "    ✗ Error al instalar dependencias" -ForegroundColor Red
    Write-Host "    Intenta manualmente: npm install" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✓ LISTO! Ahora ejecuta: npm run dev" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
