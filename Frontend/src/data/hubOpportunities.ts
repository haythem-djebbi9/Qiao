import solarPanelsImg from '../assets/images/solar_farm_tunisia_1790805165350.jpg';
import fashionTextileImg from '../assets/images/textile_fashion_apparel_1790888282892.jpg';
import oliveOilImg from '../assets/images/olive_oil_export_1790805177453.jpg';
import logisticsWarehouseImg from '../assets/images/container_port_cargo_1790805153002.jpg';
import cosmeticsImg from '../assets/images/pharma_laboratory_1790888319378.jpg';

/** Opportunités présentées dans le Commerce Hub. */
export interface HubOpportunity {
  id: string;
  badge: 'IMPORTATION' | 'PARTENARIAT' | 'EXPORTATION' | 'INVESTISSEMENT' | 'DISTRIBUTION';
  title: string;
  sector: string;
  fromCountry: string;
  toCountry: string;
  fromFlag: string;
  toFlag: string;
  amount: string;
  partnerType: string;
  publishedAgo: string;
  image: string;
  description: string;
}

export const HUB_OPPORTUNITIES: HubOpportunity[] = [
  {
    id: 'opp-solar-tunisia',
    badge: 'IMPORTATION',
    title: 'Fourniture de panneaux solaires pour le marché tunisien',
    sector: 'Énergie & Équipements',
    fromCountry: 'Chine',
    toCountry: 'Tunisie',
    fromFlag: '🇨🇳',
    toFlag: '🇹🇳',
    amount: '500 000 – 2 M USD',
    partnerType: 'Partenaire distributeur',
    publishedAgo: 'Publié il y a 2 jours',
    image: solarPanelsImg,
    description: 'Recherche de distributeurs agréés pour des modules solaires photovoltaïques haut rendement et onduleurs hybrides avec service après-vente qualifié en Tunisie.',
  },
  {
    id: 'opp-fashion-ecommerce',
    badge: 'PARTENARIAT',
    title: 'Joint-venture pour plateforme e-commerce mode',
    sector: 'Mode & Textile',
    fromCountry: 'Chine',
    toCountry: 'Maroc',
    fromFlag: '🇨🇳',
    toFlag: '🇲🇦',
    amount: '1 – 5 M USD',
    partnerType: 'Joint-venture',
    publishedAgo: 'Publié il y a 3 jours',
    image: fashionTextileImg,
    description: 'Développement d’une joint-venture technologique et logistique pour le déploiement d’une marketplace de mode transfrontalière entre la Chine et le Maroc.',
  },
  {
    id: 'opp-olive-oil-china',
    badge: 'EXPORTATION',
    title: 'Exportation d’huile d’olive vers la Chine',
    sector: 'Produits agricoles',
    fromCountry: 'Tunisie',
    toCountry: 'Chine',
    fromFlag: '🇹🇳',
    toFlag: '🇨🇳',
    amount: '300 000 – 1 M USD',
    partnerType: 'Acheteurs chinois',
    publishedAgo: 'Publié il y a 4 jours',
    image: oliveOilImg,
    description: 'Contrat d’approvisionnement en huile d’olive extra vierge conditionnée (bouteilles 500ml et 1L) pour centrales d’achat premium à Shanghai et Beijing.',
  },
  {
    id: 'opp-logistics-algeria',
    badge: 'INVESTISSEMENT',
    title: 'Investissement dans un entrepôt logistique',
    sector: 'Logistique & Supply Chain',
    fromCountry: 'Chine',
    toCountry: 'Algérie',
    fromFlag: '🇨🇳',
    toFlag: '🇩🇿',
    amount: '2 – 10 M USD',
    partnerType: 'Investissement direct',
    publishedAgo: 'Publié il y a 5 jours',
    image: logisticsWarehouseImg,
    description: 'Co-investissement dans une plateforme logistique sous douane de 12 000 m² près d’Alger avec hub de tri automatisé pour colis e-commerce.',
  },
  {
    id: 'opp-cosmetics-morocco',
    badge: 'PARTENARIAT',
    title: 'Recherche de fabricants de cosmétiques naturels',
    sector: 'Santé & Beauté',
    fromCountry: 'Maroc',
    toCountry: 'Chine',
    fromFlag: '🇲🇦',
    toFlag: '🇨🇳',
    amount: '100 000 – 500 000 USD',
    partnerType: 'Contrat de fabrication',
    publishedAgo: 'Publié il y a 6 jours',
    image: cosmeticsImg,
    description: 'Partenariat OEM/ODM pour la formulation et le conditionnement de soins cosmétiques à base d’huile d’argan et d’ingrédients botaniques certifiés bio.',
  },
];
