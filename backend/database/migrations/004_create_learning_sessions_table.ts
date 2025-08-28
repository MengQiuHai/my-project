import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('learning_sessions', (table) => {
    table.uuid('session_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.uuid('task_id').notNullable().references('task_id').inTable('task_definitions').onDelete('CASCADE');
    table.uuid('difficulty_id').notNullable().references('difficulty_id').inTable('difficulties').onDelete('CASCADE');
    table.date('session_date').notNullable();
    table.integer('focus_time_minutes').notNullable().defaultTo(0); // 专注时间（分钟）
    table.integer('result_quantity').notNullable().defaultTo(0); // 成果数量
    table.integer('focus_coins').notNullable().defaultTo(0); // 专注金币
    table.integer('result_coins').notNullable().defaultTo(0); // 成果金币
    table.integer('total_coins').notNullable().defaultTo(0); // 总金币
    table.text('notes'); // 学习笔记
    table.json('metadata').defaultTo('{}'); // 额外数据
    table.enum('status', ['completed', 'partial', 'cancelled']).defaultTo('completed');
    table.timestamps(true, true);
    
    // 索引
    table.index(['user_id']);
    table.index(['task_id']);
    table.index(['session_date']);
    table.index(['user_id', 'session_date']);
    table.index(['status']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('learning_sessions');
}