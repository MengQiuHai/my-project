import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // 清空现有数据
  await knex('achievements').del();

  // 插入默认成就
  await knex('achievements').insert([
    // 入门成就
    {
      achievement_id: knex.raw('gen_random_uuid()'),
      name: '初来乍到',
      description: '完成第一次学习记录',
      condition_expression: 'total_sessions >= 1',
      icon: '🎯',
      category: 'milestone',
      rarity: 'common',
      points: 10,
      is_active: true,
    },
    {
      achievement_id: knex.raw('gen_random_uuid()'),
      name: '百金富翁',
      description: '累计获得100金币',
      condition_expression: 'total_coins_earned >= 100',
      icon: '💰',
      category: 'coins',
      rarity: 'common',
      points: 20,
      is_active: true,
    },
    
    // 持续性成就
    {
      achievement_id: knex.raw('gen_random_uuid()'),
      name: '七日坚持',
      description: '连续打卡7天',
      condition_expression: 'consecutive_days >= 7',
      icon: '🔥',
      category: 'consistency',
      rarity: 'rare',
      points: 50,
      is_active: true,
    },
    {
      achievement_id: knex.raw('gen_random_uuid()'),
      name: '月度坚持者',
      description: '连续打卡30天',
      condition_expression: 'consecutive_days >= 30',
      icon: '🏆',
      category: 'consistency',
      rarity: 'epic',
      points: 200,
      is_active: true,
    },
    
    // 专注时间成就
    {
      achievement_id: knex.raw('gen_random_uuid()'),
      name: '专注达人',
      description: '单日专注时间超过4小时',
      condition_expression: 'daily_focus_hours >= 4',
      icon: '⏰',
      category: 'focus',
      rarity: 'rare',
      points: 30,
      is_active: true,
    },
    {
      achievement_id: knex.raw('gen_random_uuid()'),
      name: '时间管理大师',
      description: '累计专注时间超过100小时',
      condition_expression: 'total_focus_hours >= 100',
      icon: '⚡',
      category: 'focus',
      rarity: 'epic',
      points: 100,
      is_active: true,
    },
    
    // 学科成就
    {
      achievement_id: knex.raw('gen_random_uuid()'),
      name: '数学之星',
      description: '数学学科获得500金币',
      condition_expression: 'subject_coins.数学 >= 500',
      icon: '📐',
      category: 'subject',
      rarity: 'rare',
      points: 80,
      is_active: true,
    },
    {
      achievement_id: knex.raw('gen_random_uuid()'),
      name: '英语高手',
      description: '英语学科获得500金币',
      condition_expression: 'subject_coins.英语 >= 500',
      icon: '📚',
      category: 'subject',
      rarity: 'rare',
      points: 80,
      is_active: true,
    },
    
    // 挑战成就
    {
      achievement_id: knex.raw('gen_random_uuid()'),
      name: '挑战者',
      description: '完成10道困难题目',
      condition_expression: 'difficult_tasks_completed >= 10',
      icon: '💪',
      category: 'challenge',
      rarity: 'epic',
      points: 150,
      is_active: true,
    },
    {
      achievement_id: knex.raw('gen_random_uuid()'),
      name: '极限挑战',
      description: '完成5道极难题目',
      condition_expression: 'extreme_tasks_completed >= 5',
      icon: '🚀',
      category: 'challenge',
      rarity: 'legendary',
      points: 300,
      is_active: true,
    },
    
    // 金币相关成就
    {
      achievement_id: knex.raw('gen_random_uuid()'),
      name: '千金富豪',
      description: '累计获得1000金币',
      condition_expression: 'total_coins_earned >= 1000',
      icon: '💎',
      category: 'coins',
      rarity: 'epic',
      points: 100,
      is_active: true,
    },
    {
      achievement_id: knex.raw('gen_random_uuid()'),
      name: '节俭达人',
      description: '金币余额超过500',
      condition_expression: 'current_coin_balance >= 500',
      icon: '🏦',
      category: 'coins',
      rarity: 'rare',
      points: 60,
      is_active: true,
    },
  ]);
}