#!/usr/bin/env bash
# sync-issues.sh — Crea o actualiza GitHub Issues desde user_stories.json
#
# Uso:
#   ./scripts/sync-issues.sh              # solo nuevas (no toca existentes)
#   ./scripts/sync-issues.sh --update     # actualiza body de issues existentes
#   ./scripts/sync-issues.sh --dry-run    # muestra qué haría sin crear nada
#
# Requisitos:
#   - gh CLI autenticado (gh auth login)
#   - jq instalado
#   - Correr desde la raíz del proyecto nexus/

set -euo pipefail

REPO="matiasleonel28/nexus-game"
STORIES_FILE="user_stories.json"
US_DIR="us"

UPDATE=false
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --update)  UPDATE=true ;;
    --dry-run) DRY_RUN=true ;;
    --help)    echo "Uso: $0 [--update] [--dry-run]"; exit 0 ;;
  esac
done

if ! command -v gh &>/dev/null; then
  echo "ERROR: gh CLI no instalado. Instalalo desde https://cli.github.com/"
  exit 1
fi

if ! command -v jq &>/dev/null; then
  echo "ERROR: jq no instalado. Instalalo con: winget install jqlang.jq"
  exit 1
fi

if [ ! -f "$STORIES_FILE" ]; then
  echo "ERROR: No se encontró $STORIES_FILE. Corré desde la raíz del proyecto nexus/"
  exit 1
fi

echo "Leyendo user stories de $STORIES_FILE..."
TOTAL=$(jq length "$STORIES_FILE")
echo "Total US: $TOTAL"
echo ""

# Cachear issues existentes para evitar duplicados
echo "Consultando issues existentes en $REPO..."
EXISTING_ISSUES=$(gh issue list --repo "$REPO" --limit 100 --json title,number --state all 2>/dev/null || echo "[]")

created=0
skipped=0
updated=0
errors=0

for i in $(seq 0 $((TOTAL - 1))); do
  US_ID=$(jq -r ".[$i].id" "$STORIES_FILE")
  TITLE=$(jq -r ".[$i].title" "$STORIES_FILE")
  BODY_FILE=$(jq -r ".[$i].body_file" "$STORIES_FILE")
  LABELS_RAW=$(jq -r ".[$i].labels" "$STORIES_FILE")
  PHASE=$(jq -r ".[$i].phase" "$STORIES_FILE")
  DEPENDS=$(jq -r ".[$i].depends_on | join(\", \")" "$STORIES_FILE")
  BLOCKS=$(jq -r ".[$i].blocks | join(\", \")" "$STORIES_FILE")

  # Convertir labels comma-separated a flags --label
  LABEL_FLAGS=""
  IFS=',' read -ra LABEL_ARRAY <<< "$LABELS_RAW"
  for label in "${LABEL_ARRAY[@]}"; do
    LABEL_FLAGS="$LABEL_FLAGS --label \"$label\""
  done

  # Leer body del .md
  if [ -f "$BODY_FILE" ]; then
    BODY=$(cat "$BODY_FILE")
  else
    echo "  WARN: $BODY_FILE no existe, usando título como body"
    BODY="$TITLE"
  fi

  # Agregar metadata de dependencias al body
  DEP_SECTION=""
  if [ -n "$DEPENDS" ]; then
    DEP_SECTION="${DEP_SECTION}
---
**Depende de:** $DEPENDS"
  fi
  if [ -n "$BLOCKS" ]; then
    DEP_SECTION="${DEP_SECTION}
**Bloquea:** $BLOCKS"
  fi
  DEP_SECTION="${DEP_SECTION}
**Fase:** $PHASE"

  FULL_BODY="${BODY}
${DEP_SECTION}"

  # Verificar si ya existe un issue con este título
  EXISTING_NUM=$(echo "$EXISTING_ISSUES" | jq -r --arg t "$TITLE" '.[] | select(.title == $t) | .number' 2>/dev/null || echo "")

  if [ -n "$EXISTING_NUM" ]; then
    if [ "$UPDATE" = true ]; then
      if [ "$DRY_RUN" = true ]; then
        echo "  [DRY-RUN] Actualizaría issue #$EXISTING_NUM: $TITLE"
      else
        echo "  Actualizando issue #$EXISTING_NUM: $US_ID..."
        gh issue edit "$EXISTING_NUM" --repo "$REPO" --body "$FULL_BODY" 2>/dev/null && updated=$((updated + 1)) || errors=$((errors + 1))
      fi
    else
      echo "  SKIP: $US_ID ya existe como issue #$EXISTING_NUM"
      skipped=$((skipped + 1))
    fi
  else
    if [ "$DRY_RUN" = true ]; then
      echo "  [DRY-RUN] Crearía issue: $TITLE"
      echo "            Labels: $LABELS_RAW"
      created=$((created + 1))
    else
      echo "  Creando issue: $US_ID..."
      # Crear labels si no existen (gh los crea automáticamente)
      eval gh issue create --repo "$REPO" \
        --title "\"$TITLE\"" \
        --body "\"$FULL_BODY\"" \
        $LABEL_FLAGS 2>/dev/null && created=$((created + 1)) || errors=$((errors + 1))
    fi
  fi
done

echo ""
echo "=== Resumen ==="
echo "Creadas:     $created"
echo "Saltadas:    $skipped"
echo "Actualizadas: $updated"
echo "Errores:     $errors"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "(Modo dry-run — no se creó/modificó nada)"
fi
