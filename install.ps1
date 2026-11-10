# Installs the /pipeline skill and its three sub-agents into ~/.claude (user level).
#
# From a local checkout or unzipped release:
#   powershell -ExecutionPolicy Bypass -File .\install.ps1
# Standalone (downloads the files from GitHub):
#   irm https://raw.githubusercontent.com/ELjagi623/claude-pipeline-skill/main/install.ps1 | iex
#
# Optional environment variables:
#   PIPELINE_REF       branch or tag to download in standalone mode (default: main)
#   CLAUDE_CONFIG_DIR  Claude Code config directory (default: ~/.claude)

& {
    param([string]$ScriptPath)
    $ErrorActionPreference = 'Stop'

    $Repo = 'ELjagi623/claude-pipeline-skill'
    $Ref = if ($env:PIPELINE_REF) { $env:PIPELINE_REF } else { 'main' }
    $ClaudeDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME '.claude' }
    $Files = @(
        'skills/pipeline/SKILL.md',
        'agents/pipeline-planner.md',
        'agents/pipeline-developer.md',
        'agents/pipeline-tester.md'
    )

    $Src = $null
    if ($ScriptPath) {
        $dir = Split-Path -Parent $ScriptPath
        if (Test-Path (Join-Path $dir 'skills/pipeline/SKILL.md')) { $Src = $dir }
    }

    $Tmp = $null
    try {
        if (-not $Src) {
            [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
            $Tmp = Join-Path ([IO.Path]::GetTempPath()) ('claude-pipeline-' + [guid]::NewGuid().ToString('N'))
            Write-Host "Downloading $Repo@$Ref ..."
            foreach ($f in $Files) {
                $out = Join-Path $Tmp $f
                New-Item -ItemType Directory -Force -Path (Split-Path -Parent $out) | Out-Null
                Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/$Repo/$Ref/$f" -OutFile $out
            }
            $Src = $Tmp
        }

        $stamp = Get-Date -Format 'yyyyMMddHHmmss'
        foreach ($f in $Files) {
            $to = Join-Path $ClaudeDir $f
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $to) | Out-Null
            if (Test-Path $to) {
                Copy-Item $to "$to.bak.$stamp"
                Write-Host "Backed up existing $to"
            }
            Copy-Item (Join-Path $Src $f) $to -Force
            Write-Host "Installed $to"
        }
        Write-Host ''
        Write-Host 'Done. Open a NEW Claude Code session, then type: /pipeline <your full requirements>'
    }
    finally {
        if ($Tmp -and (Test-Path $Tmp)) { Remove-Item -Recurse -Force $Tmp }
    }
} $PSCommandPath
