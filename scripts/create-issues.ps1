# create-issues.ps1

# Obtiene la ruta del directorio donde se encuentra el script
$scriptPath = $PSScriptRoot

# Lee el archivo JSON que define las User Stories (que está en la carpeta raíz)
$userStories = Get-Content -Path "$scriptPath/../user_stories.json" | ConvertFrom-Json

# Itera sobre cada US y crea un issue en GitHub
foreach ($story in $userStories) {
    Write-Host "Creating issue: $($story.title)"

    # Construye la ruta completa al archivo del cuerpo
    $bodyFilePath = Join-Path -Path $scriptPath -ChildPath $story.body_file

    # Prepara los argumentos para las etiquetas
    $labelArgs = @()
    $story.labels.Split(',') | ForEach-Object {
        $labelArgs += "--label", $_.Trim()
    }

    # Ejecuta el comando de la CLI de GitHub pasando cada etiqueta como un argumento separado
    gh issue create --title "$($story.title)" --body-file "$bodyFilePath" @labelArgs --repo "matiasleonel28/nexus-game"
}

Write-Host "Process completed!"