# Push environment variables from .env.local to Vercel
# Run this after: npx vercel login
# Usage: .\scripts\push-env.ps1

$envFile = Join-Path $PSScriptRoot '..\.env.local'
if (!(Test-Path $envFile)) {
  Write-Error ".env.local not found"
  exit 1
}

# Get Vercel project ID (vercel link must be run first)
$vercelProject = & npx vercel link --yes 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to link project. Run 'npx vercel link' first."
  exit 1
}

Get-Content $envFile | Where-Object { $_ -match '^[^#].+=.' } | ForEach-Object {
  $parts = $_ -split '=', 2
  $key = $parts[0].Trim()
  $value = $parts[1].Trim()
  Write-Host "Setting $key..."
  $result = $value | npx vercel env add $key production --token (npx vercel token 2>$null) 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Failed to set $key"
  }
}

Write-Host "Done! Env vars pushed to Vercel."
