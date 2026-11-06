import { createContext, useContext } from 'react';
import { Opportunity } from '../lib/models';

export type LegalKind = 'privacy' | 'terms' | 'legal' | 'training-terms' | 'data-deletion';

export interface ContactPrefill {
  subject?: string;
  message?: string;
  sector?: string;
}

export interface AppointmentContext {
  specialty?: 'sourcing' | 'creation' | 'juridique' | 'academy' | 'partenariat';
  source?: string;
  notes?: string;
}

/** Actions transverses de l'application, accessibles depuis n'importe quelle page ou onglet. */
export interface AppActions {
  navigate: (tab: string) => void;
  openAppointment: (context?: AppointmentContext) => void;
  openCalculator: () => void;
  openLegal: (kind: LegalKind) => void;
  contactUs: (prefill?: ContactPrefill) => void;
  openArticle: (articleId: string) => void;
  openDocument: (titleOrId: string) => void;
  applyToOpportunity: (opportunity: Opportunity) => void;
  openSearch: (query?: string) => void;
  /** Page des opportunités : une opportunité, un pays, un secteur, ou toutes. */
  openOpportunities: (target?: { id?: string; country?: string; sector?: string }) => void;
}

const noop = () => undefined;

export const AppActionsContext = createContext<AppActions>({
  navigate: noop,
  openAppointment: noop,
  openCalculator: noop,
  openLegal: noop,
  contactUs: noop,
  openArticle: noop,
  openDocument: noop,
  applyToOpportunity: noop,
  openSearch: noop,
  openOpportunities: noop,
});

export const useAppActions = () => useContext(AppActionsContext);
