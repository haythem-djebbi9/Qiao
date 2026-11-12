import { MigrationInterface, QueryRunner } from 'typeorm';

export class SiteContents1794000000000 implements MigrationInterface {
  name = 'SiteContents1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "site_contents" (
        "key" character varying(120) NOT NULL,
        "data" jsonb NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_site_contents" PRIMARY KEY ("key")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "site_contents"`);
  }
}
