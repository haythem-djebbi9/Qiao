import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Notes 2 du client (23/11/2026) : la photo de groupe de la formation « Communication interculturelle
 * Chine - Afrique du Nord » montre une femme. Elle est remplacée partout (contenus, formations, articles,
 * contenus modifiés par l'administration) par une photo sans personne (fontaine en zellige).
 * Même règle que RemoveWomenPhotos1795000000000 ; même remplacement dans les données de départ.
 */
const PHOTO_MAP: Record<string, string> = {
  'photo-1522071820081-009f0129c71c': 'photo-1539020140153-e479b8c22e70',
};

const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;
const literal = (value: string) => `'${value.replace(/'/g, "''")}'`;

export class ReplaceGroupPhoto1796000000000 implements MigrationInterface {
  name = 'ReplaceGroupPhoto1796000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const pairs = Object.entries(PHOTO_MAP);
    const patterns = pairs.map(([from]) => `%${from}%`);
    const columns: { table_name: string; column_name: string; data_type: string }[] = await queryRunner.query(
      `SELECT c.table_name, c.column_name, c.data_type
         FROM information_schema.columns c
         JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
        WHERE c.table_schema = current_schema()
          AND c.data_type IN ('character varying', 'text', 'jsonb', 'json')
          AND c.table_name NOT IN ('migrations', 'typeorm_metadata')`,
    );
    for (const { table_name, column_name, data_type } of columns) {
      const isJson = data_type === 'jsonb' || data_type === 'json';
      const text = isJson ? `${quote(column_name)}::text` : quote(column_name);
      const replaced = pairs.reduce((expr, [from, to]) => `replace(${expr}, ${literal(from)}, ${literal(to)})`, text);
      const value = isJson ? `(${replaced})::${data_type}` : replaced;
      await queryRunner.query(`UPDATE ${quote(table_name)} SET ${quote(column_name)} = ${value} WHERE ${text} LIKE ANY($1)`, [patterns]);
    }
  }

  public async down(): Promise<void> {
    // Pas de retour arrière : la photo retirée ne doit pas réapparaître.
  }
}
