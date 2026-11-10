#!/usr/bin/env bash
# Installs the /pipeline skill and its three sub-agents into ~/.claude (user level).
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)"
SKILL="$HOME/.claude/skills/pipeline"
AGENTS="$HOME/.claude/agents"
STAMP="$(date +%Y%m%d%H%M%S)"
mkdir -p "$SKILL" "$AGENTS"

install_file() {
  local from="$1" to="$2"
  if [ -e "$to" ]; then
    cp "$to" "$to.bak.$STAMP"
    echo "Backed up existing $to"
  fi
  cp "$from" "$to"
  echo "Installed $to"
}

install_file "$SRC/skills/pipeline/SKILL.md" "$SKILL/SKILL.md"
for name in pipeline-planner.md pipeline-developer.md pipeline-tester.md; do
  install_file "$SRC/agents/$name" "$AGENTS/$name"
done

echo
echo "Done. Open a NEW Claude Code session, then type: /pipeline <your full requirements>"
