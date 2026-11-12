import React from 'react';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { siteSettings, SiteSettings } from '../../lib/siteSettings';

export type SocialNetwork = keyof SiteSettings['social'];

const NETWORKS: { key: SocialNetwork; label: string; brand: string }[] = [
  { key: 'instagram', label: 'Instagram', brand: 'bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]' },
  { key: 'facebook', label: 'Facebook', brand: 'bg-[#1877f2]' },
  { key: 'linkedin', label: 'LinkedIn', brand: 'bg-[#0a66c2]' },
  { key: 'youtube', label: 'YouTube', brand: 'bg-[#ff0000]' },
  { key: 'x', label: 'X', brand: 'bg-black' },
];

/** Réseaux renseignés dans « Paramètres du site » : un réseau sans adresse n'est pas affiché. */
export function activeSocialLinks() {
  const social = siteSettings().social;
  return NETWORKS.filter((network) => (social[network.key] ?? '').trim()).map((network) => ({
    ...network,
    url: social[network.key].trim(),
  }));
}

export const SocialIcon: React.FC<{ network: SocialNetwork; className?: string }> = ({ network, className = 'w-4 h-4' }) => {
  if (network === 'instagram') return <Instagram className={className} />;
  if (network === 'facebook') return <Facebook className={className} />;
  if (network === 'linkedin') return <Linkedin className={className} />;
  if (network === 'youtube') return <Youtube className={className} />;
  return (
    <span className="font-bold text-xs leading-none" aria-hidden="true">
      𝕏
    </span>
  );
};

/** Liens vers les réseaux sociaux de QIAO, dans le style de chaque page. */
export const SocialLinks: React.FC<{
  /** Classes de chaque lien. */
  itemClassName: string;
  /** Classes de l'icône. */
  iconClassName?: string;
  /** Fond aux couleurs de chaque réseau. */
  brandColors?: boolean;
}> = ({ itemClassName, iconClassName, brandColors = false }) => (
  <>
    {activeSocialLinks().map((network) => (
      <a
        key={network.key}
        href={network.url}
        target="_blank"
        rel="noreferrer"
        aria-label={network.label}
        title={network.label}
        className={`${itemClassName} ${brandColors ? network.brand : ''}`}
      >
        <SocialIcon network={network.key} className={iconClassName} />
      </a>
    ))}
  </>
);
