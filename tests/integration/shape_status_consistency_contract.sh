#!/usr/bin/env bash
set -euo pipefail

FILE='apps/web/src/app/venture/[id]/shape/actions.ts'

shape_line=$(grep -n 'from("venture_shapes").upsert' "$FILE" | head -1 | cut -d: -f1)
venture_line=$(grep -n 'from("ventures")' "$FILE" | grep 'update' -B1 -A1 | grep -n '' >/dev/null 2>&1 || true)
status_line=$(grep -n 'ventureUpdate.status = "shaped"' "$FILE" | head -1 | cut -d: -f1)
update_line=$(grep -n '\.update(ventureUpdate)' "$FILE" | head -1 | cut -d: -f1)

if [[ -z "${shape_line:-}" || -z "${status_line:-}" || -z "${update_line:-}" ]]; then
  echo 'Shape persistence contract markers are missing.' >&2
  exit 1
fi

if (( shape_line >= update_line )); then
  echo 'Shape brief must persist before venture status/metadata is updated.' >&2
  exit 1
fi

if ! grep -q 'if (shapeError)' "$FILE"; then
  echo 'Shape persistence errors must be handled before status advancement.' >&2
  exit 1
fi

echo 'Shape status consistency contract passed.'
