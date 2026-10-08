import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

export type DocumentFormat = 'PDF' | 'DOCX' | 'XLSX' | 'Vidéo';

/** Guides, études, rapports, modèles, réglementations et vidéos téléchargeables. */
@Entity('documents')
export class QiaoDocument {
  @PrimaryColumn({ length: 120 })
  id: string;

  @Column({ type: 'varchar', length: 220 })
  title: string;

  /** Badge affiché : Guide pratique, Rapport phare, Étude de marché, Guide... */
  @Column({ type: 'varchar', length: 60 })
  kind: string;

  /** Catégorie de la bibliothèque Ressources. */
  @Column({ type: 'varchar', length: 60 })
  category: string;

  @Column({ type: 'varchar', length: 10 })
  format: DocumentFormat;

  @Column({ type: 'varchar', length: 30 })
  sizeLabel: string;

  @Column({ type: 'date' })
  publishedAt: string;

  @Column({ type: 'varchar', length: 40 })
  dateLabel: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  image: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 120, default: 'QIAO Intelligence' })
  publisher: string;

  @Column({ type: 'simple-array', nullable: true })
  countries: string[] | null;

  /** Besoins couverts : Importer, Exporter, Investir, Trouver, S'implanter. */
  @Column({ type: 'simple-array', nullable: true })
  needs: string[] | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  sector: string | null;

  /** Type de rapport du hub Commerce : Rapports phares, Études de marché... */
  @Column({ type: 'varchar', length: 60, nullable: true })
  reportType: string | null;

  /** Emplacements : resources-recommended, resources-recent, resources-top, intelligence, home, rapports... */
  @Column({ type: 'simple-array', nullable: true })
  sections: string[] | null;

  @Column({ default: 0 })
  baseDownloads: number;

  @Column({ default: 0 })
  downloadsCount: number;

  @Column({ default: 0 })
  viewsCount: number;

  @Column({ default: false })
  premium: boolean;

  @Column({ default: 12 })
  pages: number;
}

@Entity('document_downloads')
export class DocumentDownload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => QiaoDocument, { onDelete: 'CASCADE', eager: true })
  document: QiaoDocument;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User | null;

  @CreateDateColumn()
  createdAt: Date;
}

/** « Demander une ressource » et demandes de replay vidéo. */
@Entity('resource_requests')
export class ResourceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, default: 'request' })
  kind: 'request' | 'replay';

  @Column({ type: 'varchar', length: 220 })
  title: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
