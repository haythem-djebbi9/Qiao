import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContentTranslations1793900000000 implements MigrationInterface {
  name = 'ContentTranslations1793900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "content_translations" (
        "language" character varying(5) NOT NULL,
        "sourceHash" character(64) NOT NULL,
        "source" text NOT NULL,
        "target" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_content_translations" PRIMARY KEY ("language", "sourceHash")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "content_translations"`);
  }
}
