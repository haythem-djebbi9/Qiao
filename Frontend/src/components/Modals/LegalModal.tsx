import React from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { LegalKind } from '../../context/AppActionsContext';

const CONTENT: Record<LegalKind, { title: string; sections: { heading: string; text: string }[] }> = {
  privacy: {
    title: 'Politique de confidentialité',
    sections: [
      {
        heading: 'Données collectées',
        text: "QIAO collecte uniquement les informations que vous saisissez dans les formulaires (identité, coordonnées professionnelles, projet) ainsi que l'historique de vos actions sur la plateforme (inscriptions, téléchargements, candidatures).",
      },
      {
        heading: 'Finalités',
        text: 'Ces données servent à traiter vos demandes, vous mettre en relation avec des partenaires vérifiés, gérer vos inscriptions QIAO Academy et vous envoyer les communications auxquelles vous avez consenti.',
      },
      {
        heading: 'Conservation et sécurité',
        text: "Les données sont hébergées dans une base PostgreSQL sécurisée, les mots de passe sont chiffrés (bcrypt) et aucune donnée n'est transmise à des tiers sans votre accord explicite.",
      },
      {
        heading: 'Vos droits',
        text: "Conformément au RGPD et aux lois tunisienne (loi 2004-63), marocaine (loi 09-08) et algérienne (loi 18-07), vous pouvez accéder, rectifier ou supprimer vos données en écrivant à privacy@qiao.tn.",
      },
    ],
  },
  terms: {
    title: "Conditions d'utilisation",
    sections: [
      {
        heading: 'Accès à la plateforme',
        text: "L'inscription est gratuite et réservée aux professionnels, experts et apprenants. Vous vous engagez à fournir des informations exactes et à garder vos identifiants confidentiels.",
      },
      {
        heading: 'Contenus et opportunités',
        text: 'Les opportunités publiées sont vérifiées par QIAO mais ne constituent pas un engagement contractuel. Toute relation d’affaires reste sous la responsabilité des parties.',
      },
      {
        heading: 'Communauté',
        text: 'Les publications doivent rester professionnelles et respectueuses. QIAO se réserve le droit de modérer tout contenu contraire à ces règles.',
      },
      {
        heading: 'Ressources téléchargeables',
        text: 'Les guides, rapports et modèles sont fournis pour un usage professionnel interne. Leur revente ou diffusion publique est interdite.',
      },
    ],
  },
  legal: {
    title: 'Mentions légales',
    sections: [
      { heading: 'Éditeur', text: 'QIAO Bridge SARL — Immeuble International City Center, Avenue de la Bourse, Les Berges du Lac, 1053 Tunis, Tunisie.' },
      { heading: 'Contact', text: 'contact@qiao.tn — +216 71 123 456 (du lundi au vendredi, 9h00 - 18h00 GMT+1).' },
      { heading: 'Bureaux', text: 'Tunis (siège), Shanghai, Alger et Casablanca.' },
      { heading: 'Propriété intellectuelle', text: "La marque QIAO (桥), le logo et l'ensemble des contenus du site sont protégés. Toute reproduction sans autorisation est interdite." },
    ],
  },
  'training-terms': {
    title: 'Conditions générales de formation',
    sections: [
      { heading: 'Inscription', text: 'Toute inscription à une formation ou à un parcours QIAO Academy est enregistrée immédiatement et donne accès aux contenus depuis votre espace membre.' },
      { heading: 'Tarifs et facturation', text: 'Les prix sont indiqués en dinars tunisiens (TND). Une facture est émise à chaque commande et payable sous 30 jours.' },
      { heading: 'Certification', text: 'Le certificat QIAO Academy est délivré après validation des évaluations de fin de module.' },
      { heading: 'Rétractation', text: "Vous disposez de 14 jours pour annuler une inscription tant que moins de 20 % du contenu a été consulté." },
    ],
  },
};

interface LegalModalProps {
  kind: LegalKind | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ kind, onClose }) => {
  if (!kind) return null;
  const content = CONTENT[kind];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{content.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700 leading-relaxed">
          {content.sections.map((section) => (
            <div key={section.heading}>
              <h4 className="font-bold text-slate-900 mb-1">{section.heading}</h4>
              <p>{section.text}</p>
            </div>
          ))}
          <p className="text-xs text-slate-400">Dernière mise à jour : octobre 2026.</p>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold cursor-pointer"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
};
