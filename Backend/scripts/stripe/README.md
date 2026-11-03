# Paiement sécurisé QIAO — adaptateur Stripe Connect

Prestataire agréé retenu le 18/10/2026 : **Stripe Connect, charges et transferts séparés, versements manuels**
(`src/modules/payments/gateway/stripe.gateway.ts`, sélectionné par `PAYMENT_PROVIDER=stripe`).
Les règles métier approuvées (120 h calendaires UTC, commission de 10 % sur le montant libéré, frais au prorata,
remboursement intégral avant démarrage) ne sont pas touchées : elles restent dans `payments.policy.ts`, l'adaptateur
ne fait qu'exécuter les opérations décidées par le module.

## Circulation des fonds

| Étape QIAO (`PaymentGateway`) | Opération Stripe |
| --- | --- |
| `createCheckout` | Session Stripe Checkout encaissée sur le compte de la **plateforme** (`capture_method=automatic`, `transfer_group=qiao_tx_<id>`). Pas de « destination charge » : rien ne part automatiquement vers le prestataire. |
| Fonds retenus | Les fonds restent dans le solde Stripe de la plateforme, détenus par Stripe (BR-02), jusqu'à l'autorisation du versement par QIAO. |
| `createAccountLink` | Compte connecté **Express** (`capabilities[transfers]`, calendrier de versement `manual`), lien d'ouverture / vérification KYC hébergé par Stripe ; une fois vérifié, lien vers le tableau de bord Express. |
| `retrieveAccount`, `account.updated` | Compte actif si la capacité `transfers` est active et `payouts_enabled` ; `pending` tant que le dossier n'est pas soumis, `restricted` sinon. |
| `payout` | Transfert rattaché au paiement (`source_transaction`) vers le compte Express, puis virement bancaire (`POST /v1/payouts` sur le compte connecté) dès que les fonds y sont disponibles. Référence QIAO = identifiant du transfert `tr_…`. |
| `cancelPayout` | Virement encore `pending` annulé (ou interdit s'il n'a pas encore été créé), transfert contre-passé : les fonds reviennent à la plateforme. Faux si le virement est en transit ou payé. |
| `refund` | Remboursement du paiement d'origine (`charge`), dans sa devise. |
| `retrieve` | Relit la session, le remboursement ou le transfert ; pour un versement, déclenche le virement si les fonds sont devenus disponibles (le rapprochement périodique fait donc progresser les versements). |
| `verifyWebhook` | En-tête `Stripe-Signature` (HMAC-SHA256, tolérance 5 min, plusieurs secrets acceptés), contrôle du mode test / réel, puis traduction de l'événement ; les paiements sont relus chez Stripe pour obtenir les frais réels. |

**Idempotence.** Chaque création porte la clé QIAO en en-tête `Idempotency-Key` (`qiao:<clé>`), et la recopie en
métadonnée `qiao_key` : un remboursement ou un transfert déjà créé est retrouvé même après les 24 h de rétention des
clés par Stripe. Les appels sont rejoués (2 fois au plus) sur incident réseau, 429 ou 5xx uniquement s'ils sont sans
effet de bord ou idempotents. Un refus définitif de Stripe (400/402/404) est rendu comme une opération en échec
(référence `failed_…`) pour déclencher l'intervention prévue par le module, au lieu d'être rejoué indéfiniment.

## Configuration

Variables (documentées dans `.env.example`) : `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`STRIPE_CONNECT_COUNTRY` (défaut `FR`), `STRIPE_CONNECT_SERVICE_AGREEMENT` (`full` / `recipient`),
`STRIPE_PAYMENT_METHOD_TYPES` (défaut `card`), `STRIPE_API_VERSION` (défaut `2024-06-20`).

Côté Stripe :
1. Activer **Connect** (profil de plateforme complété), comptes de type Express.
2. Déclarer le point d'entrée `<URL publique de l'API>/api/payments/webhooks/stripe` avec deux destinations, chacune
   avec son secret (les deux secrets dans `STRIPE_WEBHOOK_SECRET`, séparés par une virgule) :
   - *Votre compte* : `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `refund.created`, `refund.updated`, `refund.failed`, `charge.refund.updated` ;
   - *Comptes connectés* : `account.updated`, `payout.paid`, `payout.failed`, `payout.canceled`.
3. En local, avec la Stripe CLI :
   `stripe listen --forward-to localhost:4000/api/payments/webhooks/stripe --forward-connect-to localhost:4000/api/payments/webhooks/stripe`
   (le secret `whsec_…` affiché va dans `STRIPE_WEBHOOK_SECRET`). Sans webhooks, le rapprochement périodique suffit
   à faire avancer paiements, remboursements, versements et comptes, avec environ une minute de décalage.

## Points d'attention

- **Pays.** Stripe n'ouvre pas de compte de plateforme en Tunisie, au Maroc ni en Algérie. Les transferts
  transfrontaliers ne sont possibles qu'entre les États-Unis, le Canada, le Royaume-Uni, l'EEE et la Suisse ; ailleurs,
  plateforme et prestataires doivent être dans la même région.
- **Versements manuels** : Stripe impose de verser les fonds d'un compte connecté dans les 90 jours (hors États-Unis et Thaïlande).
- **Disponibilité des fonds** : un transfert rattaché au paiement n'est disponible qu'au moment où les fonds du paiement
  le sont ; le versement reste « en cours » jusque-là. En test, la carte `4000 0000 0000 0077` rend les fonds disponibles immédiatement.
- **Devises** : le transfert se fait dans la devise de règlement du paiement (exigence Stripe pour `source_transaction`),
  converti au taux du paiement si elle diffère de la devise de la transaction ; les frais sont convertis de même.
  Les montants TND (3 décimales) sont transmis en millimes ; leur acceptation par Stripe reste à confirmer en mode test.
- **Stripe ne fournit pas de service de séquestre au sens juridique** : la retenue repose sur les versements manuels.
  La qualification réglementaire du modèle (BR-02) est à valider avec Stripe et un conseil juridique avant la mise en production.
- Une nouvelle tentative de versement après un virement rejeté contre-passe d'abord l'ancien transfert puis en crée un
  nouveau sur le même paiement : comportement vérifié sur le faux serveur, à confirmer en mode test réel.

## Comptes Stripe récents (constaté le 23/10/2026 en mode test réel)

- **Accounts v2 obligatoire.** Stripe refuse désormais la création de comptes connectés avec Accounts v1 pour les
  nouvelles intégrations. Les comptes prestataires sont créés par `POST /v2/core/accounts` : configuration `recipient`
  (capacité `stripe_balance.stripe_transfers`), tableau de bord `express`, `fees_collector` et `losses_collector` à
  `application` (imposé par Stripe avec Express), adresse de contact obligatoire (e-mail QIAO du prestataire). Tout le
  reste (liens d'ouverture, accès Express, calendrier de virement manuel, transferts, virements, remboursements) passe
  par les API v1 avec l'identifiant du compte v2, ce que Stripe autorise. Exception : `STRIPE_CONNECT_SERVICE_AGREEMENT=recipient`
  reste en Accounts v1 (ce contrat n'existe pas en v2) et nécessite d'activer « Accounts v1 support » chez Stripe.
- **Managed Payments.** Sur les comptes où Stripe l'active par défaut, la session de paiement est refusée avec
  `payment_method_types`. L'adaptateur relance alors la session avec `managed_payments[enabled]=false` : avec Managed
  Payments, Stripe deviendrait vendeur officiel, ce qui est incompatible avec la retenue des fonds par QIAO.
- **Formulaire de vérification en mode test.** Le bouton « Ignorer ce formulaire » de la page Stripe renvoie vers QIAO
  sans rien envoyer : le compte reste non vérifié. Il faut remplir le formulaire jusqu'au bout (données de test Stripe).

### Résultats du 23/10/2026 — mode test Stripe réel (compte plateforme DE, EUR)

- Paiement de 150,00 € par Stripe Checkout (carte de test), frais Stripe réels 4,98 €, fonds retenus sur la plateforme.
- Déclaration : échéance = déclaration + 120 h, aucun versement avant ; échéance avancée en base pour le test.
- Versement : transfert `tr_…` vers un compte prestataire v2 vérifié (identité et IBAN de test fournis par API pour le
  test, le formulaire hébergé n'ayant pas été soumis), 130,02 € = 150 € − 15 € de commission − 4,98 € de frais ;
  transaction `PAID_OUT`, grand livre complet.
- Annulation avant démarrage : remboursement intégral `re_…` confirmé par Stripe (`REFUNDED`).
- Notifications mal signées ou non signées refusées (401). Sans `STRIPE_WEBHOOK_SECRET`, tout a été suivi par le
  rapprochement périodique.

## Vérification

Les trois scripts se lancent depuis `Backend/`.

1. **Contrôles de l'adaptateur** (aucun identifiant requis, faux serveur intégré) :
   `node scripts/stripe/adapter-checks.cjs` — signatures (valide, altérée, mauvais secret, expirée, absente), mode
   réel / test, idempotence des sessions, remboursements, transferts et virements, versement en attente de fonds puis
   déclenché, annulation avant et pendant le virement, virement rejeté avec rapatriement des fonds, refus définitifs.
2. **Parcours complet via l'API QIAO contre le faux serveur** (base dédiée, instance sur le port 4100) :
   ```
   node scripts/stripe/fake-stripe.mjs
   PORT=4100 DB_NAME=qiao_stripe_e2e PAYMENT_PROVIDER=stripe STRIPE_SECRET_KEY=sk_test_fake_e2e \
     STRIPE_API_BASE=http://127.0.0.1:12111 STRIPE_WEBHOOK_SECRET=whsec_e2e_local PAYMENT_SCHEDULER_INTERVAL_MS=5000 \
     npx ts-node -r tsconfig-paths/register src/main.ts
   FAKE_STRIPE_URL=http://127.0.0.1:12111 E2E_DB_NAME=qiao_stripe_e2e node scripts/stripe/e2e-flow.mjs
   ```
   (`STRIPE_API_BASE` est ignoré quand `NODE_ENV=production`.)
3. **Parcours complet en mode test Stripe réel** : même instance sans `STRIPE_API_BASE`, avec la vraie clé `sk_test_…`,
   puis `E2E_DB_NAME=qiao_stripe_e2e node scripts/stripe/e2e-flow.mjs` ; ouvrir les liens affichés (paiement avec la
   carte `4000 0000 0000 0077`, compte Express complété avec les données de test Stripe).

Le script de parcours vérifie que l'échéance calculée vaut déclaration + 120 h et qu'aucun versement n'a lieu avant ;
pour ne pas attendre cinq jours, il avance ensuite cette échéance **en base, pour la seule transaction de test**.

### Résultats du 18/10/2026

- `npx tsc --noEmit` : aucune erreur.
- `adapter-checks.cjs` : 25 contrôles réussis.
- `e2e-flow.mjs` contre le faux serveur : paiement de 150,00 € (frais 2,50 €), compte Express vérifié, déclaration
  (échéance + 120 h, aucun versement avant), versement de 132,50 € (150 € − 15 € de commission − 2,50 € de frais)
  par transfert `tr_…` rattaché au paiement et virement payé, transaction `PAID_OUT`, grand livre complet ; annulation
  avant démarrage remboursée intégralement (`REFUNDED`) ; notifications sans signature ou mal signées refusées (401).
