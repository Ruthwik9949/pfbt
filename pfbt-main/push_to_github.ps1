<#
push_to_github.ps1
Automatically initialize a git repo (if needed), create a GitHub repo (optional via gh), and push.
Usage examples (run in project root PowerShell):
  .\push_to_github.ps1 -Owner Ruthwik9949 -RepoName pfbt-main -Visibility public
  .\push_to_github.ps1                 # uses current folder name and Owner default

Requirements: Git must be installed. If you want the script to create the remote repo on GitHub, install GitHub CLI (gh) and authenticate (`gh auth login`).
#>
param(
    [string]
    $Owner = "Ruthwik9949",

    [string]
    $RepoName = (Split-Path -Leaf (Get-Location)),

    [ValidateSet("public", "private")]
    [string]
    $Visibility = "public",

    [switch]
    $Force
)

function Write-ErrAndExit($msg) {
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

# Check for Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-ErrAndExit "Git is not installed or not on PATH. Install Git for Windows: https://git-scm.com/download/win and re-run this script."
}

# Ensure we're in a directory with files
if (-not (Test-Path -Path ".")) {
    Write-ErrAndExit "Current directory is invalid. Run this script from your project root."
}

# Create a sensible .gitignore if missing
$gitignorePath = Join-Path (Get-Location) '.gitignore'
if (-not (Test-Path $gitignorePath) -or $Force) {
    $gitignoreContent = @"
node_modules
dist
.vscode/
.env
.env.local
.DS_Store
bun.lockb
npm-debug.log
yarn-error.log
coverage
"@
    $gitignoreContent | Out-File -FilePath $gitignorePath -Encoding UTF8 -Force
    Write-Host "Created .gitignore"
} else {
    Write-Host ".gitignore already exists - skipping"
}

# Initialize git repo if needed
$insideGit = $false
try {
    $insideGit = (git rev-parse --is-inside-work-tree) -eq 'true'
} catch {
    $insideGit = $false
}

if (-not $insideGit) {
    Write-Host "Initializing new git repository..."
    git init
} else {
    Write-Host "Directory already a git repository"
}

# Ensure there's at least one commit
$hasHead = $false
try {
    git rev-parse --verify HEAD > $null 2>&1
    if ($LASTEXITCODE -eq 0) { $hasHead = $true }
} catch { $hasHead = $false }

if (-not $hasHead) {
    git add -A
    git commit -m "Initial commit" 2>$null
    if ($LASTEXITCODE -ne 0) {
        # Try a fallback commit message
        git commit -m "chore: initial commit" 2>$null
    }
    Write-Host "Created initial commit"
} else {
    Write-Host "Repository already has commits"
}

# Ensure branch is main
try {
    git branch --show-current > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $current = (git branch --show-current).Trim()
        if (-not $current) { git branch -M main }
    } else {
        git branch -M main
    }
} catch {
    git branch -M main
}

$remoteUrl = "https://github.com/$Owner/$RepoName.git"

# If gh CLI exists, attempt to create repo with it
if (Get-Command gh -ErrorAction SilentlyContinue) {
    Write-Host "gh CLI found. Attempting to create GitHub repo $Owner/$RepoName (visibility: $Visibility)..."
    # Check auth status
    $authStatus = & gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "You are not authenticated with gh. Run: gh auth login"
        Write-Host "Falling back to adding remote and pushing (repo must be created manually), or run gh auth login and re-run this script."
        if (-not (git remote get-url origin 2>$null)) {
            git remote add origin $remoteUrl 2>$null
        }
        git push -u origin main
        Write-Host "Push attempted. If remote doesn't exist, create the repo on GitHub or use gh to create it."
        exit 0
    }

    # Create repository via gh
    $createArgs = @($RepoName, "--$Visibility", "--remote=origin", "--source=.", "--push")
    if ($Owner -and $Owner -ne ""){ $createArgs += "--team" } # no-op placeholder
    # Use gh repo create OWNER/REPO
    $fullName = "$Owner/$RepoName"
    gh repo create $fullName --$Visibility --source=. --remote=origin --push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Repository created and pushed to https://github.com/$fullName"
        exit 0
    } else {
        Write-Host "gh repo create failed; trying to add remote and push instead..."
        if (-not (git remote get-url origin 2>$null)) {
            git remote add origin $remoteUrl 2>$null
        }
        git push -u origin main
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Pushed to https://github.com/$Owner/$RepoName (remote existed or was created externally)"
            exit 0
        } else {
            Write-ErrAndExit "Push failed. Ensure the remote repo exists and you have permission to push."
        }
    }
} else {
    Write-Host "gh CLI not found. Adding remote and pushing. If the remote repo doesn't exist, create it at: $remoteUrl"
    # Add remote if missing
    try {
        git remote get-url origin > $null 2>&1
        if ($LASTEXITCODE -ne 0) {
            git remote add origin $remoteUrl
            Write-Host "Added remote origin -> $remoteUrl"
        } else {
            Write-Host "Remote 'origin' already configured"
        }
    } catch {
        git remote add origin $remoteUrl
    }

    Write-Host "Pushing to origin main..."
    git push -u origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Push successful. Repository: $remoteUrl"
        exit 0
    } else {
        Write-Host "Push failed. Possible causes: remote doesn't exist, authentication issue, or permission denied."
        Write-Host "If the remote repo doesn't exist, create it on GitHub and re-run: git push -u origin main"
        exit 1
    }
}
