import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('services')
export class ServiceOffering {
  @PrimaryColumn({ length: 80 })
  id: string;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 40 })
  category: string;

  @Column({ type: 'varchar', length: 40 })
  iconName: string;

  @Column({ type: 'varchar', length: 300 })
  image: string;

  @Column({ default: false })
  isNew: boolean;

  @Column({ type: 'varchar', length: 10, default: 'blue' })
  accentColor: 'red' | 'blue';

  @Column({ type: 'jsonb', default: () => "'[]'" })
  details: string[];

  @Column({ default: 0 })
  sortOrder: number;
}
