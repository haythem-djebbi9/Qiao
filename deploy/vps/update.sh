#!/usr/bin/env bash
# Met QIAO à jour avec la dernière version de GitHub (migrations appliquées automatiquement au redémarrage).
set -euo pipefail

VPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${VPS_DIR}"
bash backup.sh
git -C "${VPS_DIR}" pull --ff-only
docker compose up -d --build
docker image prune -f >/dev/null
docker compose ps
