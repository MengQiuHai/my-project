import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('coin_ledger', (table) => {
    table.uuid('ledger_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.enum('change_type', ['earned', 'decayed', 'redeemed', 'bonus', 'penalty']).notNullable();
    table.integer('amount').notNullable(); // 可以是正数或负数
    table.integer('balance_after').notNullable(); // 操作后的余额
    table.string('source_type', 50); // 来源类型: session, decay, redemption, achievement等
    table.uuid('reference_id'); // 关联的记录ID
    table.text('description'); // 变更描述
    table.json('metadata').defaultTo('{}'); // 额外信息
    table.timestamps(true, true);
    
    // 索引
    table.index(['user_id']);
    table.index(['change_type']);
    table.index(['source_type']);
    table.index(['reference_id']);
    table.index(['user_id', 'created_at']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('coin_ledger');
}