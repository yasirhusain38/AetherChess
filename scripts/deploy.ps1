# Aether — push to GitHub + deploy to Vercel
# Usage (from project root):  powershell -ExecutionPolicy Bypass -File .\scripts\deploy.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "==> Checking tools..." -ForegroundColor Cyan
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "git not found" }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw "gh not found — install GitHub CLI" }

# Ensure logged into GitHub
$auth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "GitHub login required. A browser/device flow will start..." -ForegroundColor Yellow
  gh auth login --hostname github.com --git-protocol https --web --skip-ssh-key
}

# Repo name
$repoName = "aether-chess"
$user = (gh api user --jq .login)
Write-Host "==> GitHub user: $user" -ForegroundColor Cyan

# Create remote if missing
$remote = git remote get-url origin 2>$null
if (-not $remote) {
  Write-Host "==> Creating public repo $user/$repoName ..." -ForegroundColor Cyan
  gh repo create $repoName --public --source=. --remote=origin --description "Aether — free-first chess OS with Ultra-Deep Scout & Twin Bot"
} else {
  Write-Host "==> Remote already set: $remote" -ForegroundColor Cyan
}

git branch -M main
git push -u origin main

Write-Host "==> GitHub: https://github.com/$user/$repoName" -ForegroundColor Green

# Vercel
Write-Host "==> Deploying to Vercel (login if needed)..." -ForegroundColor Cyan
npx --yes vercel login
npx --yes vercel --prod --yes --name aether-chess

Write-Host @"

Done.
1. Set AUTH_SECRET in Vercel Project Settings → Environment Variables
2. Optional: AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET (and other OAuth keys)
3. AUTH_URL = your https://*.vercel.app domain

"@ -ForegroundColor Green
