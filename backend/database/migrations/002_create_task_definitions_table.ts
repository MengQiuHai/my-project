import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('task_definitions', (table) => {
    table.uuid('task_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.string('subject', 50).notNullable();
    table.text('description');
    table.integer('base_coin').notNullable().defaultTo(1);
    table.string('unit_name', 30).notNullable().defaultTo('个');
    table.text('validation_rule'); // JSON string for validation logic
    table.enum('task_type', ['study', 'practice', 'exam', 'reading', 'coding', 'other']).defaultTo('study');
    table.boolean('is_active').defaultTo(true);
    table.json('metadata').defaultTo('{}'); // Additional task configuration
    table.timestamps(true, true);
    
    // 索引
    table.index(['subject']);
    table.index(['task_type']);
    table.index(['is_active']);
    table.index(['name']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('task_definitions');
}