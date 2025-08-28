import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('coin_decay_rules', (table) => {
    table.uuid('rule_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.text('description');
    table.integer('threshold_days').notNullable(); // 多少天后开始衰减
    table.decimal('decay_rate', 5, 4).notNullable(); // 衰减比例 (0.0-1.0)
    table.enum('decay_type', ['percentage', 'fixed']).defaultTo('percentage'); // 衰减类型
    table.string('applies_to', 50).defaultTo('all'); // 适用范围: all, subject, task_type
    table.string('scope_value', 50); // 范围值
    table.boolean('is_active').defaultTo(true);
    table.integer('priority').defaultTo(0); // 规则优先级
    table.json('metadata').defaultTo('{}'); // 额外配置
    table.timestamps(true, true);
    
    // 索引
    table.index(['is_active']);
    table.index(['applies_to']);
    table.index(['priority']);
    table.index(['threshold_days']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('coin_decay_rules');
}