# Déployer QIAO sur le VPS Hostinger

| Élément | Valeur |
|---|---|
| Serveur | `srv2109763.hstgr.cloud`, Ubuntu 26.10, `2.24.50.90` |
| Site | https://qiao-china.io (`www` redirige vers cette adresse) |
| Code sur le serveur | `/opt/qiao` |
| Configuration et secrets | `/opt/qiao/deploy/vps/.env` (généré sur le serveur, jamais sur GitHub) |

Tout tourne dans Docker (`deploy/vps/docker-compose.yml`) :

| Service | Rôle |
|---|---|
| `app` | L'API NestJS, qui sert aussi le site React. Les migrations de base s'appliquent à chaque démarrage |
| `db` | PostgreSQL 17, non exposé sur Internet |
| `caddy` | HTTPS automatique (Let's Encrypt) et redirection de `www` |

Volumes persistants : `db-data` (base), `uploads` (supports de formation, pièces jointes), `caddy-data` (certificats).

## 1. Première installation

**DNS d'abord.** Dans hPanel › Domaines › `qiao-china.io` › DNS :

| Type | Nom | Valeur |
|---|---|---|
| A | `@` | `2.24.50.90` |
| A | `www` | `2.24.50.90` |

Supprimez les anciens enregistrements A, AAAA, ALIAS ou CNAME sur `@` et `www` (page de parking Hostinger). Gardez les enregistrements MX et TXT.

**Installation.** Dans hPanel › VPS › Web console, en root :

```bash
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a; apt-get -o DPkg::Lock::Timeout=300 update -y; apt-get -o DPkg::Lock::Timeout=300 install -y git; git clone https://github.com/haythem-djebbi9/Qiao.git /opt/qiao; nohup bash /opt/qiao/deploy/vps/install.sh qiao-china.io admin@qiao-china.io > /root/qiao-install.log 2>&1 &
tail -f /root/qiao-install.log
```

Le script installe Docker, active le pare-feu (ports 22, 80 et 443), génère les secrets, compile et démarre l'application (5 à 15 minutes), crée les comptes et programme une sauvegarde quotidienne. Il continue même si la console se déconnecte et peut être relancé sans risque.

**Vérification :** https://qiao-china.io/api/health doit répondre `{"status":"ok","database":"up",…}`. Depuis un poste de développement, un contrôle complet en lecture seule :

```bash
node Backend/scripts/deploy/check-production.mjs https://qiao-china.io
```

## 2. Comptes de la version déployée

Le script crée trois comptes, avec des mots de passe aléatoires :

| Compte | E-mail |
|---|---|
| Administrateur | `admin@qiao-china.io` |
| Membre client (test) | `client.test@qiao-china.io` |
| Expert / prestataire (test) | `expert.test@qiao-china.io` |

Les mots de passe sont dans `/root/qiao-comptes.txt`, lisible par root uniquement. Dans la console web :

```bash
cat /root/qiao-comptes.txt
```

Notez-les dans un gestionnaire de mots de passe, puis supprimez le fichier (`rm /root/qiao-comptes.txt`). À la première connexion, changez le mot de passe administrateur dans Mon espace › Mon profil.

Ces comptes n'ont pas de boîte mail : « mot de passe oublié » ne fonctionne pas pour eux tant que ces adresses n'existent pas. **Avant l'ouverture au public, suspendez les deux comptes de test** dans Community › Administration › Membres.

Le compte de démonstration du poste local et les membres fictifs de Community n'existent pas en production.

## 3. Brancher les services externes

Pour enregistrer une clé sans l'afficher à l'écran, tapez dans la console web :

```bash
bash /opt/qiao/deploy/vps/set-secret.sh STRIPE_SECRET_KEY
```

| Service | Variables | Remarque |
|---|---|---|
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Commencez avec les clés de test (`sk_test_…`). Connect doit être activé |
| E-mails | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Indispensable : sans SMTP, « mot de passe oublié » ne fonctionne pas pour les membres. Avec une boîte Hostinger : `smtp.hostinger.com`, port `465`, `SMTP_SECURE=true` |
| Gemini | `GEMINI_API_KEY` | Assistant SEO & GEO, et traduction automatique des contenus publiés depuis l'administration (formations, événements, opportunités…). Sans clé, ces nouveaux contenus restent en français |
| Certificats | `ACADEMY_CERTIFICATE_FONT` | Facultatif : police pour les noms en chinois |
| WeChat / Facebook | `WECHAT_APP_*`, `FACEBOOK_APP_*`, `WECHAT_OA_*` | Facultatif : voir `Backend/.env.example` |

**Webhooks Stripe.** Sans eux, les paiements sont suivis par rapprochement périodique, avec un délai. Dans Stripe › Développeurs › Webhooks, créez deux destinations vers `https://qiao-china.io/api/payments/webhooks/stripe` :

| Destination | Événements |
|---|---|
| Votre compte | `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `refund.created`, `refund.updated`, `refund.failed`, `charge.refund.updated` |
| Comptes connectés | `account.updated`, `payout.paid`, `payout.failed`, `payout.canceled` |

Enregistrez les deux secrets `whsec_…` dans `STRIPE_WEBHOOK_SECRET`, séparés par une virgule.

## 4. Premiers réglages dans l'application

Avec le compte administrateur :

- [ ] **Admin : QIAO Academy › Commandes & paiements** : saisissez le taux TND → EUR et vos coordonnées bancaires. Sans eux, la carte et le virement restent désactivés.
- [ ] **Admin : QIAO Academy › Formations** : ajoutez les leçons. Le catalogue de départ n'a aucun contenu : ces formations s'affichent « Bientôt disponible » et ne peuvent pas être achetées tant qu'elles n'ont pas au moins une leçon publiée.
- [ ] **Contenu de départ à relire ou retirer** : événements, entreprises, opportunités, articles, documents, notes et avis des formations sont des exemples du template.
- [ ] **Community › Administration** : les communautés sont créées vides, sans membres ni discussions fictifs.

## 5. Avant d'ouvrir au public

- [ ] Parcours complet en mode test : achat d'une formation (carte `4242 4242 4242 4242`), certificat, prestation entre deux comptes, litige.
- [ ] Comptes de test suspendus.
- [ ] Clés Stripe réelles (`sk_live_…`) et webhooks recréés en mode réel.
- [ ] Sauvegardes copiées hors du serveur : celles de `/var/backups/qiao` restent sur le même disque (voir aussi les sauvegardes Hostinger).
- [ ] Mentions légales, conditions générales et politique de confidentialité relues par un juriste.

## Mettre à jour

Après un `git push` sur `main`, dans la console web :

```bash
bash /opt/qiao/deploy/vps/update.sh
```

Le script sauvegarde, récupère le code, recompile et redémarre.

## Exploiter le serveur

```bash
cd /opt/qiao/deploy/vps
docker compose ps                       # état des services
docker compose logs --tail=100 app      # journaux de l'application
docker compose logs --tail=50 caddy     # journaux HTTPS
bash backup.sh                          # sauvegarde immédiate
```

**Restaurer une sauvegarde** (`/var/backups/qiao`, conservation 14 jours). Attention : cela remplace les données actuelles.

```bash
cd /opt/qiao/deploy/vps
docker compose stop app
docker compose exec -T db psql -U qiao -d postgres -c "DROP DATABASE qiao WITH (FORCE)" -c "CREATE DATABASE qiao"
gunzip -c /var/backups/qiao/base-AAAA-MM-JJ_HHMM.sql.gz | docker compose exec -T db psql -U qiao -d qiao
docker compose run --rm -T --no-deps --entrypoint "" -v /var/backups/qiao:/backups:ro app tar -C /data -xzf /backups/fichiers-AAAA-MM-JJ_HHMM.tar.gz
docker compose up -d
```

## Inscription avec Facebook et WeChat

Les boutons apparaissent déjà dans la fenêtre de connexion ; ils s'activent dès que les identifiants sont enregistrés sur le serveur. Une identité n'est jamais fusionnée automatiquement avec un compte existant : le membre crée un compte ou lie le sien en confirmant son mot de passe.

**Facebook.** Sur https://developers.facebook.com :

1. *Mes apps › Créer une app*, puis le cas d'usage « Authentifier et demander des données aux utilisateurs avec Facebook Login ».
2. Dans ce cas d'usage, *Personnaliser* : ajoutez l'autorisation `email` (`public_profile` est incluse).
3. *Facebook Login › Paramètres*, « URI de redirection OAuth valides » : `https://qiao-china.io/api/auth/oauth/facebook/callback`
4. *Paramètres de l'app › Général* :
   - Domaines de l'app : `qiao-china.io`
   - Politique de confidentialité : `https://qiao-china.io/confidentialite.html`
   - Suppression des données (URL d'instructions) : `https://qiao-china.io/suppression-des-donnees.html`
   - Conditions d'utilisation : `https://qiao-china.io/?legal=terms`
   - Icône : `https://qiao-china.io/favicon.png` (à téléverser) ; catégorie : Entreprise et pages.
5. Enregistrez les identifiants sur le serveur, depuis ce PC (le mot de passe de l'app ne s'affiche pas) :

```bash
ssh -t -i ~/.ssh/qiao_vps root@2.24.50.90 bash /opt/qiao/deploy/vps/set-secret.sh FACEBOOK_APP_ID
ssh -t -i ~/.ssh/qiao_vps root@2.24.50.90 bash /opt/qiao/deploy/vps/set-secret.sh FACEBOOK_APP_SECRET
```

6. Testez avec votre propre compte Facebook, puis passez l'app en mode **Publié** (`Live`). Tant qu'elle reste en mode développement, seuls ses administrateurs et testeurs peuvent se connecter.

**WeChat.** Sur https://open.weixin.qq.com (Open Platform, à ne pas confondre avec le compte officiel) :

1. Créez un compte développeur et faites-le vérifier. WeChat demande des justificatifs d'entreprise, et la vérification peut être payante et longue.
2. *Applications › Application de site web* (网站应用) : nom, logo, description et domaine.
3. « Domaine de rappel d'autorisation » (授权回调域) : `qiao-china.io`, sans `https://` ni chemin.
4. Une fois l'application approuvée, enregistrez `WECHAT_APP_ID` et `WECHAT_APP_SECRET` avec `set-secret.sh`, comme ci-dessus.

Vérifiez d'abord les conditions auprès de WeChat : des intégrateurs indiquent qu'une entreprise vérifiée en Chine et un domaine déclaré à l'ICP sont nécessaires, ce qui peut bloquer une société étrangère et un serveur hors de Chine. Le visiteur scanne un QR code avec l'application WeChat : ce parcours convient à un ordinateur, pas à un navigateur sur le téléphone où WeChat est installé.

## Traduction du site

Le site est disponible en français, anglais, chinois et arabe (de droite à gauche). Après avoir modifié des textes dans le code :

```bash
cd Frontend
node scripts/i18n/extract.mjs
node scripts/i18n/translate.mjs
```

Committez ensuite `Frontend/public/i18n/*.json`. Détails et contrôle d'une page : [Frontend/scripts/i18n/README.md](Frontend/scripts/i18n/README.md).

## Modifier le schéma de la base

En production, le schéma n'évolue que par des migrations, appliquées automatiquement au démarrage. Après avoir modifié une entité, sur le poste de développement :

```bash
cd Backend
npm run migration:generate -- src/database/migrations/NomDuChangement
```

La commande compare les entités à la base désignée par `DB_NAME` ou `DATABASE_URL` : utilisez une base à jour de la dernière migration, pas la base locale synchronisée automatiquement. Relisez le fichier généré, puis committez-le. En local, `DB_SYNC=true` continue de synchroniser le schéma automatiquement.
