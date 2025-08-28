import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // 清空现有数据
  await knex('difficulties').del();

  // 插入默认难度等级
  await knex('difficulties').insert([
    {
      difficulty_id: knex.raw('gen_random_uuid()'),
      label: '简单',
      coefficient: 0.8,
      description: '基础题目，容易理解和完成',
      sort_order: 1,
      is_active: true,
    },
    {
      difficulty_id: knex.raw('gen_random_uuid()'),
      label: '普通',
      coefficient: 1.0,
      description: '标准难度，需要一定思考',
      sort_order: 2,
      is_active: true,
    },
    {
      difficulty_id: knex.raw('gen_random_uuid()'),
      label: '困难',
      coefficient: 1.5,
      description: '有挑战性的题目，需要深入思考',
      sort_order: 3,
      is_active: true,
    },
    {
      difficulty_id: knex.raw('gen_random_uuid()'),
      label: '极难',
      coefficient: 2.0,
      description: '高难度题目，需要综合能力',
      sort_order: 4,
      is_active: true,
    },
  ]);
}