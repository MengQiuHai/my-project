import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('redemptions', (table) => {
    table.uuid('redemption_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.uuid('reward_id').notNullable().references('reward_id').inTable('rewards').onDelete('CASCADE');
    table.integer('coins_spent').notNullable();
    table.timestamp('redeemed_at').notNullable().defaultTo(knex.fn.now());
    table.enum('status', ['pending', 'completed', 'cancelled']).defaultTo('completed');
    table.text('notes'); // 兑换备注
    table.timestamp('completed_at');
    table.json('metadata').defaultTo('{}'); // 额外信息
    table.timestamps(true, true);
    
    // 索引
    table.index(['user_id']);
    table.index(['reward_id']);
    table.index(['redeemed_at']);
    table.index(['status']);
    table.index(['user_id', 'redeemed_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('redemptions');
}