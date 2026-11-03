#!/usr/bin/env bash
# Installation de QIAO sur un VPS Ubuntu. À lancer en root ; peut être relancé sans risque (les secrets existants sont conservés).
# Usage : bash install.sh [domaine] [e-mail administrateur]
set -euo pipefail

DOMAIN="${1:-qiao-china.io}"
ADMIN_EMAIL="${2:-admin@${DOMAIN}}"
REPO_URL="https://github.com/haythem-djebbi9/Qiao.git"
APP_DIR="/opt/qiao"
VPS_DIR="${APP_DIR}/deploy/vps"
ENV_FILE="${VPS_DIR}/.env"
ACCOUNTS_FILE="/root/qiao-comptes.txt"

say() { printf '\n=== %s\n' "$*"; }
fail() { printf '\nERREUR : %s\n' "$*" >&2; exit 1; }
trap 'printf "\nERREUR : installation interrompue à la ligne %s. Voir les lignes ci-dessus.\n" "${LINENO}" >&2' ERR

[ "$(id -u)" -eq 0 ] || fail "ce script doit être lancé en root."

say "1/6 Paquets système et Docker"
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a
# Attend la fin d'une mise à jour automatique éventuelle plutôt que d'échouer sur le verrou d'apt.
APT_INSTALL="apt-get -o DPkg::Lock::Timeout=300 install -y"
apt-get -o DPkg::Lock::Timeout=300 update -y
${APT_INSTALL} ca-certificates curl git openssl ufw fail2ban
command -v docker >/dev/null 2>&1 || ${APT_INSTALL} docker.io || curl -fsSL https://get.docker.com | sh
docker compose version >/dev/null 2>&1 || ${APT_INSTALL} docker-compose-v2 || curl -fsSL https://get.docker.com | sh
docker compose version >/dev/null 2>&1 || fail "Docker Compose n'a pas pu être installé."
systemctl enable --now docker

say "2/6 Pare-feu (SSH, HTTP, HTTPS)"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

say "3/6 Code de l'application"
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" pull --ff-only
else
  git clone "${REPO_URL}" "${APP_DIR}"
fi

say "4/6 Configuration"
if [ -f "${ENV_FILE}" ]; then
  echo "${ENV_FILE} existe déjà : conservé."
else
  umask 077
  cat > "${ENV_FILE}" <<EOF
# Généré par install.sh. Pour changer une clé sans l'afficher : bash deploy/vps/set-secret.sh NOM
SITE_DOMAIN=${DOMAIN}
ACME_EMAIL=${ADMIN_EMAIL}
PUBLIC_URL=https://${DOMAIN}
DB_PASSWORD=$(openssl rand -hex 24)
DB_SYNC=false
DB_MIGRATE=true
DB_SEED=true
SEED_DEMO=false
JWT_SECRET=$(openssl rand -hex 48)
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=')
ADMIN_NAME=Administrateur QIAO

# E-mails (mot de passe oublié)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM="QIAO <no-reply@${DOMAIN}>"

# Paiements Stripe
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_COUNTRY=FR
PAYMENT_COMMISSION_PERCENT=10

# Assistant SEO & GEO de l'administration
GEMINI_API_KEY=

# Certificats : police des noms hors alphabet latin (facultatif)
ACADEMY_CERTIFICATE_FONT=

# Connexion WeChat / Facebook et compte officiel WeChat (facultatif)
WECHAT_APP_ID=
WECHAT_APP_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
WECHAT_OA_APP_ID=
WECHAT_OA_APP_SECRET=
WECHAT_OA_TOKEN=
WECHAT_OA_ENCODING_AES_KEY=
EOF
  chmod 600 "${ENV_FILE}"
  echo "${ENV_FILE} créé, avec des secrets aléatoires."
fi

say "5/6 Compilation et démarrage (5 à 10 minutes la première fois)"
cd "${VPS_DIR}"
docker compose up -d --build

say "6/6 Comptes et sauvegardes"
if [ ! -f "${ACCOUNTS_FILE}" ]; then
  ( umask 077; {
    echo "Comptes QIAO (${DOMAIN}) : fichier réservé à root, à supprimer après avoir noté les mots de passe."
    echo "Administrateur | $(grep '^ADMIN_EMAIL=' "${ENV_FILE}" | cut -d= -f2-) | $(grep '^ADMIN_PASSWORD=' "${ENV_FILE}" | cut -d= -f2-)"
  } > "${ACCOUNTS_FILE}" )
fi
docker compose exec -T app node Backend/scripts/deploy/create-accounts.mjs "${DOMAIN}" >> "${ACCOUNTS_FILE}"
chmod 600 "${ACCOUNTS_FILE}"

cat > /etc/cron.d/qiao-backup <<EOF
# Sauvegarde quotidienne de QIAO (base, fichiers, configuration) dans /var/backups/qiao, conservée 14 jours.
0 3 * * * root /bin/bash ${VPS_DIR}/backup.sh >> /var/log/qiao-backup.log 2>&1
EOF

SERVER_IP="$(hostname -I | awk '{print $1}')"
RESOLVED_IP="$(getent ahostsv4 "${DOMAIN}" | awk 'NR==1 {print $1}' || true)"
printf '\n'
docker compose ps
printf '\n'
if curl -fsS --max-time 30 "https://${DOMAIN}/api/health" >/dev/null 2>&1; then
  echo "QIAO EST EN LIGNE : https://${DOMAIN}"
elif [ "${RESOLVED_IP}" != "${SERVER_IP}" ]; then
  echo "APPLICATION DÉMARRÉE, DNS EN ATTENTE : ${DOMAIN} pointe vers ${RESOLVED_IP:-rien} au lieu de ${SERVER_IP}."
  echo "Le certificat HTTPS sera obtenu automatiquement dès que le DNS sera à jour."
else
  echo "APPLICATION DÉMARRÉE, CERTIFICAT HTTPS EN COURS : réessayez dans quelques minutes."
  echo "En cas de blocage : cd ${VPS_DIR} && docker compose logs --tail=50 caddy"
fi
echo "Comptes créés : pour les voir, tapez vous-même  cat ${ACCOUNTS_FILE}"
