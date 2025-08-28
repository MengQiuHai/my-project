import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('rewards', (table) => {
    table.uuid('reward_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.text('description');
    table.integer('cost_coins').notNullable();
    table.enum('category', ['entertainment', 'food', 'shopping', 'activity', 'rest', 'other']).defaultTo('other');
    table.string('icon', 500); // 图标URL或emoji
    table.boolean('is_active').defaultTo(true);
    table.integer('usage_limit').defaultTo(0); // 使用次数限制，0表示无限制
    table.integer('cooldown_hours').defaultTo(0); // 冷却时间（小时）
    table.json('metadata').defaultTo('{}'); // 额外配置
    table.timestamps(true, true);
    
    // 索引
    table.index(['user_id']);
    table.index(['category']);
    table.index(['cost_coins']);
    table.index(['is_active']);
    table.index(['user_id', 'is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('rewards');
}