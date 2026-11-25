/**
 * Photo d'accueil (pagode, Shanghai, minaret) en WebP léger, en trois largeurs.
 * L'original JPEG pesait 808 Ko ; ces fichiers font 23 à 114 Ko. Le nom contient une empreinte
 * du contenu : le navigateur peut les garder en cache longtemps (voir app.module.ts).
 * Le même jeu est préchargé dans index.html : garder les deux en accord.
 */
export const HOME_HERO = {
  src: '/images/accueil-1600.bffcfad5.webp',
  srcSet:
    '/images/accueil-640.822c6cfc.webp 640w, /images/accueil-1024.b6f38bf0.webp 1024w, /images/accueil-1600.bffcfad5.webp 1600w',
  /** La photo, très large, est recadrée en hauteur sur téléphone : elle y est affichée à environ deux fois la largeur de l'écran. */
  sizes: '(max-width: 768px) 200vw, 100vw',
  /** Aperçu flou de 178 octets affiché immédiatement, en attendant la photo. */
  placeholder: 'data:image/webp;base64,UklGRqoAAABXRUJQVlA4IJ4AAAAQBACdASogAA0APu1kq04ppaQiMAgBMB2JQBYdhHwNjLGsELBvyBSNAADOLTLNjF5kQ9od0QvlmZ7Fi7FQuHxlATJVHAsbjSGOoFCL2oHmURp3HE3a+7uIlSxF6+k6ebmF/tUkNAEnC79ebLNKHv7RRU7gANpoRNDxy/c/1UW503GwoSYIiQN6lP8JWh6uoV7qkoxGcHlzyCRKxQAAAA==',
};
