$ErrorActionPreference = 'Continue'
$dir = "C:\Users\USUARIO\Desktop\Python-bash\app\scripts"
$appDir = "C:\Users\USUARIO\Desktop\Python-bash\app"
$keyFile = Join-Path $dir ".api-key.tmp"

if (-not (Test-Path $keyFile)) {
    Write-Error "No existe $keyFile"
    exit 1
}

$env:OPENROUTER_API_KEY = (Get-Content $keyFile -Raw).Trim()
$logFile = Join-Path $dir "enrich-log.txt"
$tmpOut = Join-Path $dir ".enrich-stdout.tmp"
$tmpErr = Join-Path $dir ".enrich-stderr.tmp"

Add-Content $logFile "`n[run] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Operador de llamada (&) + redirección directa a archivo: propaga el
# exit code real en $LASTEXITCODE (Start-Process -PassThru lo pierde).
& node (Join-Path $dir "enrich-all.mjs") > $tmpOut 2> $tmpErr
$code = $LASTEXITCODE

if (Test-Path $tmpOut) { Get-Content $tmpOut -Raw | Add-Content $logFile; Remove-Item $tmpOut -Force -ErrorAction SilentlyContinue }
if (Test-Path $tmpErr) { Get-Content $tmpErr -Raw | Add-Content $logFile; Remove-Item $tmpErr -Force -ErrorAction SilentlyContinue }

# contar lecciones pendientes (sin enriquecer o sin quiz_ia)
$modulos = Join-Path $appDir "src\data\modulos"
$pending = 0
$total = 0
Get-ChildItem "$modulos\*.json" | ForEach-Object {
    $j = Get-Content $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($l in $j) {
        $total++
        $hasQuiz = ($null -ne $l.quiz_ia) -and ($l.quiz_ia.Count -ge 2)
        if ((-not $l._enriched) -or (-not $hasQuiz)) { $pending++ }
    }
}

Add-Content $logFile "[run] exit=$code total=$total pendientes=$pending"
if ($pending -eq 0) {
    Add-Content $logFile "[run] COMPLETADO - todas las lecciones listas"
}

# checkpoint: commitear el progreso ganado en esta pasada
$gitStatus = git -C $appDir status --porcelain -- "src/data/modulos" 2>$null
if ($gitStatus) {
    git -C $appDir add -- "src/data/modulos" 2>$null
    git -C $appDir commit -m "chore(data): progreso IA (pendientes: $pending)" 2>$null | Out-Null
    Add-Content $logFile "[run] checkpoint commit realizado"
}
exit $code
