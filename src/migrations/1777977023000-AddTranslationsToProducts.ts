import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTranslationsToProducts1777977023000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS name_en VARCHAR(255),
      ADD COLUMN IF NOT EXISTS description_en TEXT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products 
      DROP COLUMN IF EXISTS name_en,
      DROP COLUMN IF EXISTS description_en;
    `);
  }
}
