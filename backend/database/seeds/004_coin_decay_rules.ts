import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // 清空现有数据
  await knex('coin_decay_rules').del();

  // 插入默认衰减规则
  await knex('coin_decay_rules').insert([
    {
      rule_id: knex.raw('gen_random_uuid()'),
      name: '通用30天衰减',
      description: '获得金币30天后开始衰减，每次衰减5%',
      threshold_days: 30,
      decay_rate: 0.05,
      decay_type: 'percentage',
      applies_to: 'all',
      is_active: true,
      priority: 1,
    },
    {
      rule_id: knex.raw('gen_random_uuid()'),
      name: '数学知识衰减',
      description: '数学相关金币21天后开始衰减，每次衰减8%',
      threshold_days: 21,
      decay_rate: 0.08,
      decay_type: 'percentage',
      applies_to: 'subject',
      scope_value: '数学',
      is_active: true,
      priority: 2,
    },
    {
      rule_id: knex.raw('gen_random_uuid()'),
      name: '英语记忆衰减',
      description: '英语相关金币14天后开始衰减，每次衰减10%',
      threshold_days: 14,
      decay_rate: 0.10,
      decay_type: 'percentage',
      applies_to: 'subject',
      scope_value: '英语',
      is_active: true,
      priority: 2,
    },
    {
      rule_id: knex.raw('gen_random_uuid()'),
      name: '编程技能衰减',
      description: '编程相关金币45天后开始衰减，每次衰减3%',
      threshold_days: 45,
      decay_rate: 0.03,
      decay_type: 'percentage',
      applies_to: 'subject',
      scope_value: '编程',
      is_active: true,
      priority: 2,
    },
  ]);
}