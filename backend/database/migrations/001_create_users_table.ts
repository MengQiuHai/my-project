import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('user_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('username', 50).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100);
    table.string('last_name', 100);
    table.string('avatar_url', 500);
    table.text('bio');
    table.json('preferences').defaultTo('{}');
    table.enum('status', ['active', 'inactive', 'suspended']).defaultTo('active');
    table.enum('role', ['user', 'admin']).defaultTo('user');
    table.timestamp('email_verified_at');
    table.timestamp('last_login_at');
    table.timestamps(true, true);
    
    // 索引
    table.index(['username']);
    table.index(['email']);
    table.index(['status']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}