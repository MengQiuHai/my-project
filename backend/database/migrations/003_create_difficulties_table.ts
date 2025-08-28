import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('difficulties', (table) => {
    table.uuid('difficulty_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('label', 50).notNullable().unique();
    table.decimal('coefficient', 4, 2).notNullable().defaultTo(1.0);
    table.text('description');
    table.integer('sort_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // 索引
    table.index(['label']);
    table.index(['coefficient']);
    table.index(['sort_order']);
    table.index(['is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('difficulties');
}