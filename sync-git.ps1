<#
.SYNOPSIS
    Script đồng bộ Git & Deploy sử dụng GitHub Token từ file .env

.DESCRIPTION
    Tự động đọc biến GITHUB_TOKEN từ file .env để thực hiện các thao tác Git:
    - pull: Kéo code mới nhất từ remote main
    - push: Commit và đẩy code lên remote main
    - setup: Cấu hình remote origin sử dụng token trong .env
    - clean-remote: Đặt lại remote origin về dạng chuẩn (không kèm token)
    - deploy: Kiểm tra và push lên main kích hoạt auto-deploy (Vercel)

.EXAMPLE
    .\sync-git.ps1 pull
    .\sync-git.ps1 push "Cập nhật tính năng mới"
    .\sync-git.ps1 setup
#>

param(
    [Parameter(Position=0)]
    [ValidateSet("pull", "push", "setup", "clean-remote", "status", "sync-templates", "help")]
    [string]$Action = "help",

    [Parameter(Position=1)]
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"
$EnvFile = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $EnvFile)) {
    Write-Error "Khong tim thay file .env tai: $EnvFile"
    exit 1
}

# Đọc token và cấu hình từ .env
$envConfig = @{}
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $keyVal = $line -split "=", 2
        if ($keyVal.Count -eq 2) {
            $envConfig[$keyVal[0].Trim()] = $keyVal[1].Trim()
        }
    }
}

$token = $envConfig["GITHUB_TOKEN"]
$repoUrl = $envConfig["GITHUB_REPO_URL"]
if (-not $repoUrl) {
    $owner = $envConfig["GITHUB_REPO_OWNER"]
    $repo = $envConfig["GITHUB_REPO_NAME"]
    if ($owner -and $repo) {
        $repoUrl = "https://github.com/$owner/$repo.git"
    } else {
        $repoUrl = "https://github.com/th982982982-crypto/KKhome.git"
    }
}

if (-not $token) {
    Write-Error "Bien GITHUB_TOKEN chua duoc thiet lap trong file .env!"
    exit 1
}

# Chuẩn hóa URL có chứa token
$cleanUrl = $repoUrl -replace "https://[^@]+@", "https://"
$authUrl = $cleanUrl -replace "https://", "https://${token}@"

function Show-Help {
    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host "         HUONG DAN SU DUNG SYNC-GIT VOI .ENV         " -ForegroundColor Yellow
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host "1. Keo code moi nhat tu main:"
    Write-Host "   .\sync-git.ps1 pull" -ForegroundColor Green
    Write-Host ""
    Write-Host "2. Commit va day code len main (kich hoat deploy):"
    Write-Host "   .\sync-git.ps1 push `"Noi dung commit`"" -ForegroundColor Green
    Write-Host ""
    Write-Host "3. Cai dat Git Remote Origin tu dong su dung token trong .env:"
    Write-Host "   .\sync-git.ps1 setup" -ForegroundColor Green
    Write-Host "   (Sau khi setup, co the dung truc tiep: git pull / git push)"
    Write-Host ""
    Write-Host "4. Xoa token khoi Git Remote (ve URL chuan khong token):"
    Write-Host "   .\sync-git.ps1 clean-remote" -ForegroundColor Green
    Write-Host ""
    Write-Host "5. Xem trang thai git:"
    Write-Host "   .\sync-git.ps1 status" -ForegroundColor Green
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host ""
}

switch ($Action) {
    "pull" {
        Write-Host "Dang keo code tu origin/main..." -ForegroundColor Cyan
        git pull $authUrl main
        Write-Host "Pull code thanh cong!" -ForegroundColor Green
    }

    "push" {
        if (-not $Message) {
            Write-Host "Vui long nhap noi dung commit message!" -ForegroundColor Red
            Write-Host "Vi du: .\sync-git.ps1 push `"Cap nhat giao dien`"" -ForegroundColor Yellow
            exit 1
        }
        Write-Host "Dang kiem tra va tu dong cap nhat bieu mau tu thu muc..." -ForegroundColor Cyan
        try {
            node scripts/update-templates.mjs
        } catch {
            Write-Host "Luu y: Bo qua buoc tu dong cap nhat mau do loi: $_" -ForegroundColor Yellow
        }

        Write-Host "Dang them file va tao commit..." -ForegroundColor Cyan
        git add .
        $status = git status --porcelain
        if (-not $status) {
            Write-Host "Khong co thay doi nao can commit." -ForegroundColor Yellow
        } else {
            git commit -m "$Message"
        }
        Write-Host "Dang day code len origin/main..." -ForegroundColor Cyan
        git push $authUrl main
        Write-Host "Push code thanh cong! (Trang thai Vercel se tu dong build & deploy)" -ForegroundColor Green
    }

    "sync-templates" {
        Write-Host "Dang quet va tu dong cap nhat bieu mau tu thu muc..." -ForegroundColor Cyan
        node scripts/update-templates.mjs
    }

    "setup" {
        Write-Host "Dang cap nhat Git Remote Origin theo token trong .env..." -ForegroundColor Cyan
        git remote set-url origin $authUrl
        Write-Host "Cau hinh remote origin thanh cong!" -ForegroundColor Green
        Write-Host "Tu bay gio ban co the go truc tiep: git pull va git push" -ForegroundColor Yellow
    }

    "clean-remote" {
        Write-Host "Dang dat lai Remote Origin ve URL khong chua token..." -ForegroundColor Cyan
        git remote set-url origin $cleanUrl
        Write-Host "Da lam sach remote origin!" -ForegroundColor Green
    }

    "status" {
        git status
    }

    default {
        Show-Help
    }
}
