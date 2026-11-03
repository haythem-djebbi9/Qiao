/**
 * Contrat avec le prestataire de paiement agréé (BR-02) : QIAO ne détient jamais directement les fonds du client.
 * Les fonds sont encaissés, retenus puis remboursés ou versés par le prestataire (ex. compte de type
 * « marketplace / séquestre » : Stripe Connect avec versements manuels, Mangopay, ou un établissement de paiement local).
 *
 * Toute implémentation doit :
 *  - rendre idempotents les remboursements et versements (même clé ⇒ même opération, jamais deux) ;
 *  - signer ses notifications (webhooks) et permettre à QIAO de vérifier leur authenticité ;
 *  - ne jamais présenter une opération comme réussie avant confirmation (statut « pending » sinon).
 */
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export type GatewayEventType =
  | 'checkout.succeeded'
  | 'checkout.failed'
  | 'refund.succeeded'
  | 'refund.failed'
  | 'payout.paid'
  | 'payout.failed'
  | 'account.updated';

/** État du compte de versement chez le prestataire : vérification (KYC) en cours, actif, ou restreint. */
export type PayoutAccountState = 'pending' | 'active' | 'restricted';

export interface GatewayEvent {
  /** Identifiant unique de l'événement (stable en cas de renvoi par le prestataire). */
  id: string;
  type: GatewayEventType;
  /** Référence de l'objet concerné (session de paiement, remboursement, versement, compte). */
  objectRef: string;
  amount?: number;
  currency?: string;
  /** Frais prélevés par le prestataire de paiement (paiement confirmé). */
  fee?: number;
  /** Référence du paiement confirmé (session de paiement réussie). */
  paymentRef?: string;
  accountStatus?: PayoutAccountState;
  failureReason?: string;
  metadata: Record<string, string>;
  createdAt: string;
}

export interface GatewayOperation {
  ref: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  failureReason?: string | null;
  amount?: number;
  currency?: string;
  fee?: number;
  paymentRef?: string | null;
}

export interface PaymentGateway {
  readonly name: string;
  /** Faux si aucun prestataire de paiement n'est configuré : aucun paiement ne peut être créé. */
  readonly available: boolean;

  createCheckout(input: {
    transactionId: string;
    reference: string;
    description: string;
    amount: number;
    currency: string;
    returnUrl: string;
    idempotencyKey: string;
    /** Libellé affiché sur la page de paiement (par défaut « Prestation QIAO <référence> »). */
    label?: string;
  }): Promise<{ ref: string; url: string }>;

  /** Invalide une session de paiement non réglée (nouvelle tentative ou annulation). */
  expireCheckout(ref: string): Promise<void>;

  /** Lien d'ouverture / de vérification du compte de versement du prestataire (KYC chez le prestataire de paiement). */
  createAccountLink(input: {
    userId: string;
    accountRef: string | null;
    returnUrl: string;
    /** Contact du prestataire (obligatoire chez certains prestataires de paiement pour ouvrir le compte). */
    email?: string | null;
    displayName?: string | null;
  }): Promise<{ accountRef: string; url: string }>;

  refund(input: { paymentRef: string; amount: number; currency: string; idempotencyKey: string; metadata: Record<string, string> }): Promise<GatewayOperation>;

  /** `paymentRef` : paiement confirmé dont proviennent les fonds (les prestataires qui rattachent le versement au paiement s'en servent). */
  payout(input: {
    accountRef: string;
    amount: number;
    currency: string;
    idempotencyKey: string;
    metadata: Record<string, string>;
    paymentRef?: string | null;
  }): Promise<GatewayOperation>;

  /** Annule un versement non encore exécuté ; faux s'il est devenu irrévocable. */
  cancelPayout(ref: string): Promise<boolean>;

  /** Consultation de l'état réel d'une opération (rapprochement si une notification a été perdue). */
  retrieve(kind: 'checkout' | 'refund' | 'payout', ref: string): Promise<GatewayOperation>;

  /** État de vérification du compte de versement (rapprochement si une notification « account.updated » a été perdue). */
  retrieveAccount?(accountRef: string): Promise<PayoutAccountState>;

  /**
   * Vérifie la signature et l'horodatage d'une notification ; lève une erreur si elle n'est pas authentique.
   * Renvoie null pour une notification authentique sans objet pour QIAO (type d'événement non suivi).
   */
  verifyWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): GatewayEvent | null | Promise<GatewayEvent | null>;
}
