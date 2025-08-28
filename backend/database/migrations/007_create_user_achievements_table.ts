import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_achievements', (table) => {
    table.uuid('user_achievement_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.uuid('achievement_id').notNullable().references('achievement_id').inTable('achievements').onDelete('CASCADE');
    table.timestamp('achieved_at').notNullable().defaultTo(knex.fn.now());
    table.json('achievement_data').defaultTo('{}'); // 成就时的数据快照
    table.timestamps(true, true);
    
    // 唯一约束：用户不能重复获得同一成就
    table.unique(['user_id', 'achievement_id']);
    
    // 索引
    table.index(['user_id']);
    table.index(['achievement_id']);
    table.index(['achieved_at']);
    table.index(['user_id', 'achieved_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user_achievements');
}