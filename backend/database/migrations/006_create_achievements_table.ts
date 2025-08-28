import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('achievements', (table) => {
    table.uuid('achievement_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.text('description').notNullable();
    table.text('condition_expression').notNullable(); // 成就条件表达式
    table.string('icon', 500); // 图标URL或名称
    table.string('category', 50).defaultTo('general'); // 成就分类
    table.enum('rarity', ['common', 'rare', 'epic', 'legendary']).defaultTo('common');
    table.integer('points').defaultTo(0); // 成就点数
    table.boolean('is_active').defaultTo(true);
    table.json('metadata').defaultTo('{}'); // 额外配置
    table.timestamps(true, true);
    
    // 索引
    table.index(['name']);
    table.index(['category']);
    table.index(['rarity']);
    table.index(['is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('achievements');
}