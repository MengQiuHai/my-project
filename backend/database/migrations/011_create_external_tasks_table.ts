import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('external_tasks', (table) => {
    table.uuid('external_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('app_name', 100).notNullable();
    table.string('api_key', 255).notNullable().unique();
    table.string('signature_secret', 255).notNullable();
    table.text('description');
    table.json('task_mapping').defaultTo('{}'); // 任务类型映射配置
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_used_at');
    table.integer('usage_count').defaultTo(0);
    table.json('metadata').defaultTo('{}'); // 额外配置
    table.timestamps(true, true);
    
    // 索引
    table.index(['api_key']);
    table.index(['app_name']);
    table.index(['is_active']);
    table.index(['last_used_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('external_tasks');
}