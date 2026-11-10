# Installs the /pipeline skill and its three sub-agents into ~/.claude (user level).
$ErrorActionPreference = 'Stop'
$src    = Split-Path -Parent $MyInvocation.MyCommand.Path
$claude = Join-Path $HOME '.claude'
$skill  = Join-Path $claude 'skills\pipeline'
$agents = Join-Path $claude 'agents'

New-Item -ItemType Directory -Force -Path $skill  | Out-Null
New-Item -ItemType Directory -Force -Path $agents | Out-Null

$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$targets = @(
    @{ From = Join-Path $src 'skills\pipeline\SKILL.md'; To = Join-Path $skill 'SKILL.md' }
)
foreach ($name in 'pipeline-planner.md','pipeline-developer.md','pipeline-tester.md') {
    $targets += @{ From = Join-Path $src "agents\$name"; To = Join-Path $agents $name }
}

foreach ($t in $targets) {
    if (Test-Path $t.To) {
        Copy-Item $t.To "$($t.To).bak.$stamp"
        Write-Host "Backed up existing $($t.To)"
    }
    Copy-Item $t.From $t.To -Force
    Write-Host "Installed $($t.To)"
}
Write-Host ''
Write-Host 'Done. Open a NEW Claude Code session, then type: /pipeline <your full requirements>'
