# sync-issues.ps1 — Crea o actualiza GitHub Issues desde user_stories.json
#
# Uso:
#   .\scripts\sync-issues.ps1              # solo nuevas (no toca existentes)
#   .\scripts\sync-issues.ps1 -Update      # actualiza body de issues existentes
#   .\scripts\sync-issues.ps1 -DryRun      # muestra qué haría sin crear nada
#
# Requisitos:
#   - gh CLI autenticado (gh auth login)
#   - Correr desde la raíz del proyecto nexus/

param(
    [switch]$Update,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$Repo = "matiasleonel28/nexus-game"
$StoriesFile = "user_stories.json"

# Verificar requisitos
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "gh CLI no instalado. Instalalo desde https://cli.github.com/"
    exit 1
}

if (-not (Test-Path $StoriesFile)) {
    Write-Error "No se encontro $StoriesFile. Corre desde la raiz del proyecto nexus/"
    exit 1
}

Write-Host "Leyendo user stories de $StoriesFile..." -ForegroundColor Cyan
$stories = Get-Content $StoriesFile -Raw -Encoding utf8 | ConvertFrom-Json
Write-Host "Total US: $($stories.Count)" -ForegroundColor Cyan
Write-Host ""

# Cachear issues existentes
Write-Host "Consultando issues existentes en $Repo..." -ForegroundColor Cyan
$existingRaw = gh issue list --repo $Repo --limit 100 --json title,number --state all 2>$null
if ($existingRaw) {
    $existing = $existingRaw | ConvertFrom-Json
} else {
    $existing = @()
}

$created = 0
$skipped = 0
$updated = 0
$errors = 0

foreach ($us in $stories) {
    $usId = $us.id
    $title = $us.title
    $bodyFile = $us.body_file
    $labelsRaw = $us.labels
    $phase = $us.phase
    $dependsOn = if ($us.depends_on) { $us.depends_on -join ", " } else { "" }
    $blocks = if ($us.blocks) { $us.blocks -join ", " } else { "" }

    # Leer body del .md
    if (Test-Path $bodyFile) {
        $body = Get-Content $bodyFile -Raw -Encoding utf8
    } else {
        Write-Host "  WARN: $bodyFile no existe, usando titulo como body" -ForegroundColor Yellow
        $body = $title
    }

    # Agregar metadata de dependencias
    $depSection = "`n---"
    if ($dependsOn) { $depSection += "`n**Depende de:** $dependsOn" }
    if ($blocks) { $depSection += "`n**Bloquea:** $blocks" }
    $depSection += "`n**Fase:** $phase"

    $fullBody = "$body`n$depSection"

    # Labels como array de flags
    $labelFlags = @()
    foreach ($label in ($labelsRaw -split ",")) {
        $labelFlags += "--label"
        $labelFlags += $label.Trim()
    }

    # Verificar si existe
    $existingIssue = $existing | Where-Object { $_.title -eq $title }

    # Write body to temp file to avoid PowerShell quoting issues
    $tempFile = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllText($tempFile, $fullBody, [System.Text.Encoding]::UTF8)

    if ($existingIssue) {
        if ($Update) {
            if ($DryRun) {
                Write-Host "  [DRY-RUN] Actualizaria issue #$($existingIssue.number): $title" -ForegroundColor Yellow
            } else {
                Write-Host "  Actualizando issue #$($existingIssue.number): $usId..." -ForegroundColor Blue
                try {
                    gh issue edit $existingIssue.number --repo $Repo --body-file $tempFile
                    $updated++
                } catch {
                    Write-Host "  ERROR actualizando $usId : $_" -ForegroundColor Red
                    $errors++
                }
            }
        } else {
            Write-Host "  SKIP: $usId ya existe como issue #$($existingIssue.number)" -ForegroundColor Gray
            $skipped++
        }
    } else {
        if ($DryRun) {
            Write-Host "  [DRY-RUN] Crearia issue: $title" -ForegroundColor Green
            Write-Host "            Labels: $labelsRaw" -ForegroundColor DarkGray
            $created++
        } else {
            Write-Host "  Creando issue: $usId..." -ForegroundColor Green
            try {
                gh issue create --repo $Repo --title $title --body-file $tempFile @labelFlags
                $created++
            } catch {
                Write-Host "  ERROR creando $usId : $_" -ForegroundColor Red
                $errors++
            }
        }
    }

    Remove-Item $tempFile -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=== Resumen ===" -ForegroundColor Cyan
Write-Host "Creadas:      $created"
Write-Host "Saltadas:     $skipped"
Write-Host "Actualizadas: $updated"
Write-Host "Errores:      $errors"

if ($DryRun) {
    Write-Host "`n(Modo dry-run - no se creo/modifico nada)" -ForegroundColor Yellow
}
