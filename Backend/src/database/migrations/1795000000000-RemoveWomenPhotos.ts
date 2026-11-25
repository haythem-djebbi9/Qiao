import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Demande du client (11/11/2026) : aucune photo de femme sur le site.
 *  - portraits des membres et des formatrices : retirés (les initiales sont affichées) ;
 *  - illustrations : remplacées par une photo équivalente sans personne.
 * Les mêmes remplacements ont été faits dans les données de départ (Backend/src/database/data).
 */
const PHOTO_MAP: Record<string, string> = {
  'photo-1573496359142-b8d87734a5a2': 'photo-1497366811353-6870744d04b2',
  'photo-1529156069898-49953e39b3ac': 'photo-1508804185872-d7badad00f7d',
  'photo-1580489944761-15a19d654956': 'photo-1456513080510-7bf3a84b82f8',
  'photo-1534528741775-53994a69daeb': 'photo-1457369804613-52c61a468e7d',
  'photo-1556740758-90de374c12ad': 'photo-1526628953301-3e589a6a8b74',
  'photo-1500937386664-56d1dfef3854': 'photo-1500382017468-9049fed747ef',
  'photo-1589829545856-d10d557cf95f': 'photo-1450101499163-c8848c66ca85',
  'photo-1551836022-d5d88e9218df': 'photo-1501504905252-473c47e087f8',
  'photo-1522202176988-66273c2fd55f': 'photo-1503676260728-1c00da094a0b',
  'photo-1581091226825-a6a2a5aee158': 'photo-1486262715619-67b85e0b08d3',
  'photo-1573497019940-1c28c88b4f3e': 'photo-1503676260728-1c00da094a0b',
  'photo-1577962917302-cd874c4e31d2': 'photo-1497366216548-37526070297c',
  'photo-1579684385127-1ef15d508118': 'photo-1576086213369-97a306d36557',
  'photo-1544005313-94ddf0286df2': 'photo-1505664194779-8beaceb93744',
  'photo-1534751516642-a1af1ef26a56': 'photo-1450101499163-c8848c66ca85',
  'photo-1438761681033-6461ffad8d80': 'photo-1586528116311-ad8dd3c8310d',
  'photo-1531123897727-8f129e1688ce': 'photo-1554224155-6726b3ff858f',
  'photo-1594744803329-e58b31de8bf5': 'photo-1505664194779-8beaceb93744',
  'photo-1489424731084-a5d8b219a5bb': 'photo-1474979266404-7eaacbcd87c5',
  'photo-1521737604893-d14cc237f11d': 'photo-1497366811353-6870744d04b2',
};

/** Visuels QIAO locaux (« asset:fichier ») remplacés. */
const ASSET_MAP: Record<string, string> = {
  'asset:china_ecommerce_report_1790808742649.jpg': 'asset:ecommerce_devices_marketplace_1790934935730.jpg',
  'asset:cat_salons_canton_1791399715213.jpg': 'asset:event_canton_fair_exterior_1791399745116.jpg',
  'asset:pharma_laboratory_1790888319378.jpg': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
  'asset:qiao_academy_hero_1787505055310.jpg': 'asset:qiao_academy_hero_1791404215248.jpg',
  'asset:analyses_hero_data_desk_1791034393458.jpg': 'asset:intelligence_globe_hero_1789905766229.jpg',
  'asset:sante_doctor_microscope_card_1791221540419.jpg': 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
};

const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;
const literal = (value: string) => `'${value.replace(/'/g, "''")}'`;

export class RemoveWomenPhotos1795000000000 implements MigrationInterface {
  name = 'RemoveWomenPhotos1795000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const portraits = Object.keys(PHOTO_MAP).map((id) => `%${id}%`);

    // 1. Photos de profil des membres : retirées (initiales).
    await queryRunner.query(`UPDATE "users" SET "avatarUrl" = NULL WHERE "avatarUrl" LIKE ANY($1)`, [portraits]);

    // 2. Photos des formatrices : retirées (initiales).
    const instructorTables: { table_name: string }[] = await queryRunner.query(
      `SELECT table_name FROM information_schema.columns WHERE table_schema = current_schema() AND column_name = 'instructorImg'`,
    );
    for (const { table_name } of instructorTables) {
      await queryRunner.query(`UPDATE ${quote(table_name)} SET "instructorImg" = '' WHERE "instructorImg" LIKE ANY($1)`, [portraits]);
    }

    // 3. Toutes les autres images (contenus, fiches, contenus modifiés par l'administration) : équivalent sans personne.
    const pairs = [...Object.entries(PHOTO_MAP), ...Object.entries(ASSET_MAP)];
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
      await queryRunner.query(
        `UPDATE ${quote(table_name)} SET ${quote(column_name)} = ${value} WHERE ${text} LIKE ANY($1)`,
        [patterns],
      );
    }
  }

  public async down(): Promise<void> {
    // Pas de retour arrière : les photos retirées ne doivent pas réapparaître.
  }
}
