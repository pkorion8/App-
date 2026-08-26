#!/usr/bin/env bash
set -euo pipefail

python3 - <<'PY'
from pathlib import Path
import re
import sys

root = Path("supabase")
sql_files = sorted(root.rglob("*.sql"))

# Production/shared database SQL must never manufacture ventures. Legitimate
# venture creation belongs to authenticated application code initiated by a user.
venture_insert = re.compile(r"\binsert\s+into\s+(?:public\.)?ventures\b", re.IGNORECASE | re.DOTALL)

# Historical fixture ideas called out as forbidden production data. Keep this
# check scoped to database SQL so static demo copy in the UI remains allowed.
forbidden_fixture_terms = [
    "namaz",
    "roti",
    "nail design",
    "receipt manager",
    "appointment",
    "workout management",
    "tax collection",
]

problems: list[str] = []
for path in sql_files:
    text = path.read_text(encoding="utf-8")
    if venture_insert.search(text):
        problems.append(f"{path}: contains an INSERT INTO ventures statement")

    lower = text.lower()
    for term in forbidden_fixture_terms:
        if term in lower:
            problems.append(f"{path}: contains forbidden production fixture term {term!r}")

if problems:
    print("Production fixture guard failed:", file=sys.stderr)
    for problem in problems:
        print(f"- {problem}", file=sys.stderr)
    sys.exit(1)

print(f"Production fixture guard passed across {len(sql_files)} Supabase SQL files.")
PY
