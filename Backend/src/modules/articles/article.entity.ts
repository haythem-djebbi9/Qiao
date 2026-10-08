import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Articles, décryptages et analyses QIAO Intelligence. */
@Entity('articles')
export class Article {
  @PrimaryColumn({ length: 80 })
  id: string;

  @Column({ type: 'varchar', length: 220 })
  title: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'varchar', length: 60 })
  category: string;

  @Column({ type: 'date' })
  publishedAt: string;

  @Column({ type: 'varchar', length: 40 })
  dateLabel: string;

  @Column({ type: 'varchar', length: 30 })
  readTime: string;

  @Column({ type: 'varchar', length: 300 })
  image: string;

  @Column({ type: 'varchar', length: 120, default: 'QIAO Intelligence' })
  author: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  keyPoints: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  content: string[];

  /** home, intelligence, analyses */
  @Column({ type: 'simple-array' })
  placements: string[];

  @Column({ type: 'simple-array', nullable: true })
  countries: string[] | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  sector: string | null;

  /** Tendances macro, Prévisions & Scénarios, Analyses par pays, Marchés e-commerce. */
  @Column({ type: 'varchar', length: 60, nullable: true })
  analysisType: string | null;

  @Column({ default: 0 })
  viewsCount: number;
}
