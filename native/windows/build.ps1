#!/usr/bin/env pwsh
# Builds the Windows UI Automation helper as a self-contained single-file exe and
# copies it to resources/bin/. Requires the .NET 8 SDK and a Windows host.
$ErrorActionPreference = 'Stop'

$scriptDir = $PSScriptRoot
$repoRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
$project = Join-Path $scriptDir 'ShortcutHelper.csproj'
$publishDir = Join-Path $scriptDir 'publish'
$binDir = Join-Path $repoRoot 'resources/bin'

dotnet publish $project `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -o $publishDir

New-Item -ItemType Directory -Force -Path $binDir | Out-Null
Copy-Item (Join-Path $publishDir 'shortcut-helper-win.exe') `
    (Join-Path $binDir 'shortcut-helper-win.exe') -Force

Write-Host "Built shortcut-helper-win.exe -> $binDir"
