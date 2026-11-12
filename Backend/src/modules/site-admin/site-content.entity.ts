import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Contenu du site modifié depuis l'administration (secteurs, sous-secteurs et leurs fiches...).
 * Le site affiche le contenu d'origine, remplacé par ce document quand il existe.
 */
@Entity('site_contents')
export class SiteContent {
  /** Ex. « sector:logistique ». */
  @PrimaryColumn({ type: 'varchar', length: 120 })
  key: string;

  @Column({ type: 'jsonb' })
  data: Record<string, unknown>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
