#!/bin/bash
# Script pentru actualizarea memoriei CLAUDE_BRAIN
# Rulează: bash update_memory.sh

CLAUDE_BRAIN="C:/Users/david/Documents/HUMANEX/HUMANEX Brain/CLAUDE_BRAIN"
MEMORY="C:/Users/david/Documents/HUMANEX/HUMANEX Brain/MEMORY"

echo "=== Actualizare CLAUDE_BRAIN ==="
echo ""

# 1. Citește starea curentă a proiectului
echo "1. Verifică starea proiectului HUMANEX..."
cd "C:/Users/david/Documents/HUMANEX/human-exchange-main" 2>/dev/null && {
  echo "   - Git status:" && git status --short
  echo "   - Ultimul commit:" && git log --oneline -1
}

echo ""
echo "2. Fișiere CLAUDE_BRAIN:"
ls -la "$CLAUDE_BRAIN"

echo ""
echo "=== Memory sync complete ==="
echo ""
echo "Pentru update manual:"
echo "  - SESSION_LOG.md → adaugă sesiunea nouă"
echo "  - PROJECT_SNAPSHOT.md → actualizează starea tehnică"
echo "  - MEMORY.md.txt → actualizează contextul pentru Claude.ai"
