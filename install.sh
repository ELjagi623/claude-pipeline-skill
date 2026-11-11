#!/usr/bin/env bash
# Installs the /pipeline skill (with its three role definitions) into ~/.claude (user level).
# The roles live inside the skill folder, so nothing is registered as a global sub-agent:
# without typing /pipeline, no pipeline agent can be picked automatically.
#
# From a local checkout or unzipped release:
#   bash install.sh
# Standalone (downloads the files from GitHub):
#   curl -fsSL https://raw.githubusercontent.com/ELjagi623/claude-pipeline-skill/main/install.sh | bash
#
# Optional environment variables:
#   PIPELINE_REF       branch or tag to download in standalone mode (default: main)
#   CLAUDE_CONFIG_DIR  Claude Code config directory (default: ~/.claude)
set -euo pipefail

REPO="ELjagi623/claude-pipeline-skill"
REF="${PIPELINE_REF:-main}"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
FILES=(
  "skills/pipeline/SKILL.md"
  "skills/pipeline/roles/planner.md"
  "skills/pipeline/roles/developer.md"
  "skills/pipeline/roles/tester.md"
)
# Registered as global sub-agents by versions before 1.3.1; moved aside so they cannot be auto-selected.
LEGACY=(
  "agents/pipeline-planner.md"
  "agents/pipeline-developer.md"
  "agents/pipeline-tester.md"
)

SRC=""
SCRIPT_PATH="${BASH_SOURCE[0]:-}"
if [ -n "$SCRIPT_PATH" ] && [ -f "$SCRIPT_PATH" ]; then
  DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
  [ -f "$DIR/skills/pipeline/SKILL.md" ] && SRC="$DIR"
fi

if [ -z "$SRC" ]; then
  command -v curl >/dev/null 2>&1 || { echo "Error: curl is required for standalone install." >&2; exit 1; }
  SRC="$(mktemp -d)"
  trap 'rm -rf "$SRC"' EXIT
  echo "Downloading $REPO@$REF ..."
  for f in "${FILES[@]}"; do
    mkdir -p "$SRC/$(dirname "$f")"
    curl -fsSL "https://raw.githubusercontent.com/$REPO/$REF/$f" -o "$SRC/$f"
  done
fi

STAMP="$(date +%Y%m%d%H%M%S)"
for f in "${FILES[@]}"; do
  to="$CLAUDE_DIR/$f"
  mkdir -p "$(dirname "$to")"
  if [ -e "$to" ]; then
    cp "$to" "$to.bak.$STAMP"
    echo "Backed up existing $to"
  fi
  cp "$SRC/$f" "$to"
  echo "Installed $to"
done

for f in "${LEGACY[@]}"; do
  old="$CLAUDE_DIR/$f"
  if [ -e "$old" ]; then
    mv "$old" "$old.bak.$STAMP"
    echo "Moved legacy global agent aside: $old -> $old.bak.$STAMP"
  fi
done

echo
echo "Done. Open a NEW Claude Code session, then type: /pipeline <your full requirements>"
