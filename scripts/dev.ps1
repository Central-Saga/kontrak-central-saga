[CmdletBinding()]
param(
    [ValidateSet("up", "down", "rebuild", "logs", "cert")]
    [string] $Action = "up"
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

function Assert-ComposeRuntime {
    Assert-ComposeCommand | Out-Null
}

function Assert-LastExitCode {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Message
    )

    if ($LASTEXITCODE -ne 0) {
        throw $Message
    }
}

function New-DevCertificate {
    $certDir = Join-Path $RepoRoot "docker\proxy\certs"
    $crtPath = Join-Path $certDir "local-dev.crt"
    $keyPath = Join-Path $certDir "local-dev.key"
    $domains = @("app.kontrak-centralsaga.site", "api.kontrak-centralsaga.site")

    $certGenerator = "compose-runtime"
    if (Get-Command "mkcert" -ErrorAction SilentlyContinue) {
        $certGenerator = "mkcert"
    }
    elseif (Get-Command "openssl" -ErrorAction SilentlyContinue) {
        $certGenerator = "openssl"
    }
    else {
        Assert-ComposeRuntime
    }

    New-Item -ItemType Directory -Force -Path $certDir | Out-Null
    Remove-Item -LiteralPath $crtPath, $keyPath -Force -ErrorAction SilentlyContinue

    if ($certGenerator -eq "mkcert") {
        Push-Location $certDir
        try {
            & mkcert -cert-file "local-dev.crt" -key-file "local-dev.key" @domains
            Assert-LastExitCode "mkcert failed to generate the local development certificate."
        }
        finally {
            Pop-Location
        }
        return
    }

    if ($certGenerator -eq "openssl") {
        & openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
            -keyout $keyPath `
            -out $crtPath `
            -subj "/CN=app.kontrak-centralsaga.site" `
            -addext "subjectAltName=DNS:app.kontrak-centralsaga.site,DNS:api.kontrak-centralsaga.site"
        Assert-LastExitCode "openssl failed to generate the local development certificate."
        return
    }

    $composeCommand = Assert-ComposeCommand
    $runtime = $composeCommand.Runtime
    $mountSource = $certDir.Replace("\", "/")
    $mount = "type=bind,source=$mountSource,target=/certs"
    & $runtime run --rm --mount $mount docker.io/alpine/openssl:latest req `
        -x509 -nodes -days 365 -newkey rsa:2048 `
        -keyout "/certs/local-dev.key" `
        -out "/certs/local-dev.crt" `
        -subj "/CN=app.kontrak-centralsaga.site" `
        -addext "subjectAltName=DNS:app.kontrak-centralsaga.site,DNS:api.kontrak-centralsaga.site"

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

function Invoke-DevCompose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]] $ComposeArgs
    )

    $composeCommand = Assert-ComposeCommand
    $executable = $composeCommand.Executable
    $arguments = $composeCommand.Args + @("-f", "docker-compose.dev.yml") + $ComposeArgs
    $previousContainersConf = $env:CONTAINERS_CONF
    $previousHttpPort = $env:PROXY_HTTP_PORT
    $previousHttpsPort = $env:PROXY_HTTPS_PORT
    $previousFrontendAppUrl = $env:FRONTEND_APP_URL
    $previousBackendAppUrl = $env:BACKEND_APP_URL
    $previousPublicApiBaseUrl = $env:NEXT_PUBLIC_API_BASE_URL
    $previousSanctumDomains = $env:SANCTUM_STATEFUL_DOMAINS

    try {
        if ($composeCommand.Runtime -like "*podman*") {
            $env:CONTAINERS_CONF = Join-Path $RepoRoot "docker\podman\containers.conf"
            if ([string]::IsNullOrWhiteSpace($env:PROXY_HTTP_PORT)) {
                $env:PROXY_HTTP_PORT = "8080"
            }
            if ([string]::IsNullOrWhiteSpace($env:PROXY_HTTPS_PORT)) {
                $env:PROXY_HTTPS_PORT = "8443"
            }
            if ([string]::IsNullOrWhiteSpace($env:FRONTEND_APP_URL)) {
                $env:FRONTEND_APP_URL = "https://app.kontrak-centralsaga.site:$($env:PROXY_HTTPS_PORT)"
            }
            if ([string]::IsNullOrWhiteSpace($env:BACKEND_APP_URL)) {
                $env:BACKEND_APP_URL = "https://api.kontrak-centralsaga.site:$($env:PROXY_HTTPS_PORT)"
            }
            if ([string]::IsNullOrWhiteSpace($env:NEXT_PUBLIC_API_BASE_URL)) {
                $env:NEXT_PUBLIC_API_BASE_URL = "https://api.kontrak-centralsaga.site:$($env:PROXY_HTTPS_PORT)"
            }
            if ([string]::IsNullOrWhiteSpace($env:SANCTUM_STATEFUL_DOMAINS)) {
                $env:SANCTUM_STATEFUL_DOMAINS = "localhost,127.0.0.1,app.kontrak-centralsaga.site,app.kontrak-centralsaga.site:$($env:PROXY_HTTPS_PORT)"
            }
        }

        & $executable @arguments
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
    finally {
        $env:CONTAINERS_CONF = $previousContainersConf
        $env:PROXY_HTTP_PORT = $previousHttpPort
        $env:PROXY_HTTPS_PORT = $previousHttpsPort
        $env:FRONTEND_APP_URL = $previousFrontendAppUrl
        $env:BACKEND_APP_URL = $previousBackendAppUrl
        $env:NEXT_PUBLIC_API_BASE_URL = $previousPublicApiBaseUrl
        $env:SANCTUM_STATEFUL_DOMAINS = $previousSanctumDomains
    }
}

function Invoke-DevBuild {
    $composeCommand = Assert-ComposeCommand

    if ($composeCommand.Runtime -like "*podman*") {
        & $composeCommand.Runtime build -t "kontrak-central-saga-frontend-dev" -f "frontend/Dockerfile.dev" "frontend"
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }

        & $composeCommand.Runtime build -t "kontrak-central-saga-backend-dev" -f "backend/Dockerfile" "backend"
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }

        return
    }

    Invoke-DevCompose -ComposeArgs @("build")
}

function Test-CommandSuccess {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Executable,

        [string[]] $CommandArgs = @()
    )

    $resolvedExecutable = Resolve-Executable $Executable
    if (-not $resolvedExecutable) {
        return $false
    }

    & $resolvedExecutable @CommandArgs | Out-Null
    return $LASTEXITCODE -eq 0
}

function Resolve-Executable {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Executable
    )

    $command = Get-Command $Executable -ErrorAction SilentlyContinue
    if ($command) {
        Add-ExecutableDirectoryToPath $command.Source
        return $command.Source
    }

    $commonPaths = @()
    if ($Executable -eq "podman") {
        $commonPaths = @(
            "C:\Program Files\RedHat\Podman\podman.exe",
            "C:\Program Files\Podman\podman.exe"
        )
    }
    elseif ($Executable -eq "podman-compose") {
        $commonPaths = @(
            "$env:APPDATA\Python\Python314\Scripts\podman-compose.exe",
            "$env:APPDATA\Python\Python313\Scripts\podman-compose.exe",
            "$env:APPDATA\Python\Python312\Scripts\podman-compose.exe",
            "$env:APPDATA\Python\Python311\Scripts\podman-compose.exe",
            "$env:LOCALAPPDATA\Programs\Python\Python314\Scripts\podman-compose.exe",
            "$env:LOCALAPPDATA\Programs\Python\Python313\Scripts\podman-compose.exe",
            "$env:LOCALAPPDATA\Programs\Python\Python312\Scripts\podman-compose.exe",
            "$env:LOCALAPPDATA\Programs\Python\Python311\Scripts\podman-compose.exe"
        )
    }

    foreach ($path in $commonPaths) {
        if (Test-Path -LiteralPath $path) {
            Add-ExecutableDirectoryToPath $path
            return $path
        }
    }

    return $null
}

function Add-ExecutableDirectoryToPath {
    param(
        [Parameter(Mandatory = $true)]
        [string] $ExecutablePath
    )

    $directory = Split-Path -Parent $ExecutablePath
    if (($env:Path -split ";") -notcontains $directory) {
        $env:Path = "$env:Path;$directory"
    }
}

function Assert-ComposeCommand {
    if (Test-CommandSuccess "docker" @("compose", "version")) {
        return [pscustomobject]@{
            Executable = Resolve-Executable "docker"
            Args       = @("compose")
            Runtime    = "docker"
        }
    }

    if (Test-CommandSuccess "podman" @("compose", "version")) {
        $podman = Resolve-Executable "podman"
        return [pscustomobject]@{
            Executable = $podman
            Args       = @("compose")
            Runtime    = $podman
        }
    }

    if (Test-CommandSuccess "podman-compose" @("--version")) {
        return [pscustomobject]@{
            Executable = Resolve-Executable "podman-compose"
            Args       = @()
            Runtime    = Resolve-Executable "podman"
        }
    }

    throw "No supported compose command found in PATH. Install Podman with podman compose, podman-compose, or Docker Desktop, then open a new terminal."
}

switch ($Action) {
    "up" {
        New-DevCertificate
        Invoke-DevBuild
        Invoke-DevCompose -ComposeArgs @("up", "-d")
    }
    "rebuild" {
        New-DevCertificate
        Invoke-DevBuild
        Invoke-DevCompose -ComposeArgs @("up", "-d", "--force-recreate")
    }
    "down" {
        Invoke-DevCompose -ComposeArgs @("down")
    }
    "logs" {
        Invoke-DevCompose -ComposeArgs @("logs", "-f", "frontend", "backend", "proxy")
    }
    "cert" {
        New-DevCertificate
    }
}
