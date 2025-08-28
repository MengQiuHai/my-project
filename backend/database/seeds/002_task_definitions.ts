import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // 清空现有数据
  await knex('task_definitions').del();

  // 插入默认任务类型
  await knex('task_definitions').insert([
    // 数学相关
    {
      task_id: knex.raw('gen_random_uuid()'),
      name: '数学习题',
      subject: '数学',
      description: '完成数学练习题',
      base_coin: 2,
      unit_name: '题',
      task_type: 'practice',
      is_active: true,
    },
    {
      task_id: knex.raw('gen_random_uuid()'),
      name: '数学阅读',
      subject: '数学',
      description: '阅读数学教材或资料',
      base_coin: 1,
      unit_name: '页',
      task_type: 'reading',
      is_active: true,
    },
    
    // 英语相关
    {
      task_id: knex.raw('gen_random_uuid()'),
      name: '英语单词',
      subject: '英语',
      description: '背诵英语单词',
      base_coin: 1,
      unit_name: '个',
      task_type: 'study',
      is_active: true,
    },
    {
      task_id: knex.raw('gen_random_uuid()'),
      name: '英语阅读',
      subject: '英语',
      description: '英语文章阅读理解',
      base_coin: 3,
      unit_name: '篇',
      task_type: 'reading',
      is_active: true,
    },
    {
      task_id: knex.raw('gen_random_uuid()'),
      name: '英语写作',
      subject: '英语',
      description: '英语作文练习',
      base_coin: 5,
      unit_name: '篇',
      task_type: 'practice',
      is_active: true,
    },
    
    // 专业课相关
    {
      task_id: knex.raw('gen_random_uuid()'),
      name: '专业课习题',
      subject: '专业课',
      description: '专业课练习题',
      base_coin: 3,
      unit_name: '题',
      task_type: 'practice',
      is_active: true,
    },
    {
      task_id: knex.raw('gen_random_uuid()'),
      name: '专业课阅读',
      subject: '专业课',
      description: '专业课教材学习',
      base_coin: 2,
      unit_name: '页',
      task_type: 'reading',
      is_active: true,
    },
    
    // 编程相关
    {
      task_id: knex.raw('gen_random_uuid()'),
      name: '编程练习',
      subject: '编程',
      description: '完成编程题目',
      base_coin: 4,
      unit_name: '题',
      task_type: 'coding',
      is_active: true,
    },
    {
      task_id: knex.raw('gen_random_uuid()'),
      name: '代码阅读',
      subject: '编程',
      description: '阅读和学习代码',
      base_coin: 2,
      unit_name: '个',
      task_type: 'reading',
      is_active: true,
    },
    
    // 通用任务
    {
      task_id: knex.raw('gen_random_uuid()'),
      name: '模拟考试',
      subject: '通用',
      description: '进行模拟考试',
      base_coin: 10,
      unit_name: '套',
      task_type: 'exam',
      is_active: true,
    },
  ]);
}