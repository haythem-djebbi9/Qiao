#!/usr/bin/env bash
# Sauvegarde la base, les fichiers téléversés et la configuration dans /var/backups/qiao ; conservation de 14 jours.
set -euo pipefail

VPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="/var/backups/qiao"
STAMP="$(date +%Y-%m-%d_%H%M)"

umask 077
mkdir -p "${BACKUP_DIR}"
cd "${VPS_DIR}"
docker compose exec -T db pg_dump -U qiao qiao | gzip > "${BACKUP_DIR}/base-${STAMP}.sql.gz"
docker compose exec -T app tar -C /data -czf - uploads > "${BACKUP_DIR}/fichiers-${STAMP}.tar.gz"
cp .env "${BACKUP_DIR}/env-${STAMP}"
find "${BACKUP_DIR}" -type f -mtime +14 -delete
echo "Sauvegarde ${STAMP} terminée dans ${BACKUP_DIR}"
