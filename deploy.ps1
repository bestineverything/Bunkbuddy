# Netlify deployment zip creator
# Creates a clean zip with site files at root level
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$zipPath = Join-Path $projectRoot "bunkbuddy-deploy.zip"

# Remove old zip if exists
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Files and folders to include
$include = @(
    "index.html",
    "app.html",
    "contact.html",
    "terms.html",
    "privacy.html",
    "404.html",
    "_redirects",
    "netlify.toml",
    "favicon.ico",
    "css",
    "js",
    "pages",
    "assets",
    "server"
)

# Exclude node_modules from server to reduce zip size
$exclude = @(
    "server\node_modules",
    "server\*.log",
    ".git",
    ".gitignore",
    "deploy.ps1",
    "bunkbuddy-deploy.zip"
)

Write-Host "Creating deployment zip..."

# Use Shell.Application to create zip
$shell = New-Object -ComObject Shell.Application
$zipFile = $shell.NameSpace(0)
$zipFile.CopyHere($projectRoot, 0x10)  # 0x10 = No progress UI

# Actually, let's use a different approach - Compress-Archive
$compressParams = @{
    Path = @()
    DestinationPath = $zipPath
    CompressionLevel = "Optimal"
}

foreach ($item in $include) {
    $fullPath = Join-Path $projectRoot $item
    if (Test-Path $fullPath) {
        $compressParams.Path += $fullPath
    } else {
        Write-Warning "Missing: $item"
    }
}

# Exclude node_modules
$compressParams.Exclude = @("server\node_modules\*")

try {
    Compress-Archive @compressParams -Force
    $size = (Get-Item $zipPath).Length / 1MB
    Write-Host "Deployment zip created: $zipPath ($([math]::Round($size, 2)) MB)"
    Write-Host ""
    Write-Host "Upload this zip to Netlify:"
    Write-Host "  1. Go to https://app.netlify.com/drop"
    Write-Host "  2. Drag and drop $zipPath"
    Write-Host ""
    Write-Host "Or use Netlify CLI:"
    Write-Host "  netlify deploy --prod --dir=. --zip=$zipPath"
} catch {
    Write-Error "Failed to create zip: $_"
}
