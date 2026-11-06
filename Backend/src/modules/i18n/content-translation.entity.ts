import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/** Traduction d'un texte publié par l'administration (les textes du code sont dans les dictionnaires du site). */
@Entity('content_translations')
export class ContentTranslation {
  @PrimaryColumn({ type: 'varchar', length: 5 })
  language: string;

  /** Empreinte SHA-256 du texte français : clé courte, quelle que soit sa longueur. */
  @PrimaryColumn({ type: 'char', length: 64 })
  sourceHash: string;

  @Column({ type: 'text' })
  source: string;

  @Column({ type: 'text' })
  target: string;

  @CreateDateColumn()
  createdAt: Date;
}
