import { Injectable } from '@nestjs/common';
import { GatewayOperation } from './gateway/payment-gateway';

type CheckoutHandler = (id: string, op: GatewayOperation) => Promise<boolean>;

/**
 * Paiements encaissés par le même prestataire pour d'autres modules que les prestations (ex. commandes QIAO Academy).
 * Le module concerné enregistre un préfixe (« academy-order: ») : la notification de paiement dont la référence
 * commence par ce préfixe lui est remise, au lieu d'être cherchée parmi les transactions de prestation.
 */
@Injectable()
export class ExternalCheckouts {
  private readonly handlers = new Map<string, CheckoutHandler>();

  register(prefix: string, handler: CheckoutHandler) {
    this.handlers.set(prefix, handler);
  }

  /** null : aucune référence externe (transaction de prestation) ; sinon, résultat du module destinataire. */
  async dispatch(reference: string | undefined, op: GatewayOperation): Promise<boolean | null> {
    if (!reference) return null;
    for (const [prefix, handler] of this.handlers) {
      if (reference.startsWith(prefix)) return handler(reference.slice(prefix.length), op);
    }
    return null;
  }
}
