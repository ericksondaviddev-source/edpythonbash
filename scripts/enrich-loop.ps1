$ErrorActionPreference = 'Continue'
$dir = "C:\Users\USUARIO\Desktop\Python-bash\app\scripts"
$keyFile = Join-Path $dir ".api-key.tmp"

if (-not (Test-Path $keyFile)) {
    Write-Error "No existe $keyFile"
    exit 1
}

$env:OPENROUTER_API_KEY = (Get-Content $keyFile -Raw).Trim()
$logFile = Join-Path $dir "enrich-log.txt"

Add-Content $logFile "`n[run] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
node (Join-Path $dir "enrich-all.mjs") *>> $logFile
$code = $LASTEXITCODE

# contar lecciones pendientes (sin enriquecer o sin quiz_ia)
$modulos = "C:\Users\USUARIO\Desktop\Python-bash\app\src\data\modulos"
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
exit $code
