#!/usr/bin/env bash
# Enregistre une clé dans deploy/vps/.env sans l'afficher, puis redémarre l'application.
# Usage : bash set-secret.sh STRIPE_SECRET_KEY
set -euo pipefail

NAME="${1:?Usage : bash set-secret.sh NOM_DE_LA_VARIABLE}"
VPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${VPS_DIR}/.env"

read -rsp "Valeur de ${NAME} (la saisie ne s'affiche pas) : " VALUE
printf '\n'
grep -q "^${NAME}=" "${ENV_FILE}" || printf '%s=\n' "${NAME}" >> "${ENV_FILE}"
VALUE="${VALUE}" awk -v name="${NAME}" 'index($0, name "=") == 1 { print name "=" ENVIRON["VALUE"]; next } { print }' "${ENV_FILE}" > "${ENV_FILE}.tmp"
cat "${ENV_FILE}.tmp" > "${ENV_FILE}"
rm -f "${ENV_FILE}.tmp"

cd "${VPS_DIR}"
docker compose up -d app
echo "${NAME} enregistrée, application redémarrée."
