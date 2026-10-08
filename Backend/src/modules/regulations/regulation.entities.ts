import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Position tarifaire du Système Harmonisé avec les droits appliqués aux importations chinoises. */
@Entity('hs_codes')
export class HsCode {
  @PrimaryColumn({ length: 10 })
  code: string;

  @Column({ type: 'varchar', length: 160 })
  label: string;

  @Column({ type: 'varchar', length: 80 })
  category: string;

  /** Droits de douane (%) par pays : { maroc, algerie, tunisie, egypte, libye }. */
  @Column({ type: 'jsonb' })
  duties: Record<string, number>;

  @Column({ type: 'simple-array', nullable: true })
  keywords: string[] | null;

  /** Normes / certifications à prévoir. */
  @Column({ type: 'text', nullable: true })
  requirements: string | null;

  @Column({ default: false })
  featured: boolean;
}

/** Fiche réglementaire d'un pays ou d'un accord commercial. */
@Entity('regulation_profiles')
export class RegulationProfile {
  @PrimaryColumn({ length: 80 })
  id: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  kind: 'country' | 'agreement';

  @Column({ type: 'varchar', length: 2, nullable: true })
  countryCode: string | null;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  requirements: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  documents: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  agencies: string[];

  @Column({ type: 'varchar', length: 60, nullable: true })
  clearanceTime: string | null;

  /** Document téléchargeable associé (id de la table documents). */
  @Column({ type: 'varchar', length: 120, nullable: true })
  guideDocumentId: string | null;
}
