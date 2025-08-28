import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

describe('Growth Bank System Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let taskId: string;
  let sessionId: string;

  beforeAll(async () => {
    // Ensure test database is clean
    // Note: In a real scenario, you'd set up a test database
    console.log('Setting up integration tests...');
  });

  afterAll(async () => {
    // Clean up test data
    console.log('Cleaning up integration tests...');
  });

  describe('Authentication Flow', () => {
    test('should register a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.token).toBeDefined();
      
      authToken = response.body.data.token;
      userId = response.body.data.user.user_id;
    });

    test('should login with valid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    test('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('testuser');
    });
  });

  describe('Learning Session Flow', () => {
    test('should create a learning session', async () => {
      const sessionData = {
        task_id: 'default-math-task', // Assuming this exists from seed data
        difficulty_id: 'easy-difficulty',
        focus_time_minutes: 60,
        result_quantity: 10,
        notes: 'Integration test session',
      };

      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session_id).toBeDefined();
      expect(response.body.data.total_coins).toBeGreaterThan(0);
      
      sessionId = response.body.data.session_id;
    });

    test('should get user learning sessions', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toBeInstanceOf(Array);
      expect(response.body.data.sessions.length).toBeGreaterThan(0);
    });

    test('should get session by ID', async () => {
      const response = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session_id).toBe(sessionId);
    });
  });

  describe('Coin System Flow', () => {
    test('should get user coin balance', async () => {
      const response = await request(app)
        .get('/api/coins/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.current_coins).toBeGreaterThan(0);
    });

    test('should get coin transaction history', async () => {
      const response = await request(app)
        .get('/api/coins/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toBeInstanceOf(Array);
    });

    test('should get coin statistics', async () => {
      const response = await request(app)
        .get('/api/coins/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalEarned');
      expect(response.body.data).toHaveProperty('totalSpent');
    });
  });

  describe('Achievement System Flow', () => {
    test('should get user achievements', async () => {
      const response = await request(app)
        .get('/api/achievements')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.achievements).toBeInstanceOf(Array);
    });

    test('should check for new achievements after session', async () => {
      const response = await request(app)
        .post('/api/achievements/check')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('newAchievements');
    });
  });

  describe('Rewards System Flow', () => {
    test('should get available rewards', async () => {
      const response = await request(app)
        .get('/api/rewards')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rewards).toBeInstanceOf(Array);
    });

    test('should get user redemption history', async () => {
      const response = await request(app)
        .get('/api/rewards/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.redemptions).toBeInstanceOf(Array);
    });
  });

  describe('Analytics Flow', () => {
    test('should get dashboard summary', async () => {
      const response = await request(app)
        .get('/api/stats/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data).toHaveProperty('performance');
    });

    test('should get learning trends', async () => {
      const response = await request(app)
        .get('/api/stats/trends?period=7d')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trends).toBeInstanceOf(Array);
    });

    test('should get performance metrics', async () => {
      const response = await request(app)
        .get('/api/stats/performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.performance).toBeDefined();
    });

    test('should get comparative analytics', async () => {
      const response = await request(app)
        .get('/api/stats/comparative')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userRank');
      expect(response.body.data).toHaveProperty('percentile');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid authentication', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle missing authentication', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle invalid session creation', async () => {
      const invalidData = {
        task_id: 'non-existent-task',
        difficulty_id: 'invalid-difficulty',
        focus_time_minutes: -1,
        result_quantity: -5,
      };

      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    test('should respect rate limits on login attempts', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginData);
      }

      // Should be rate limited now
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(429);

      expect(response.body.success).toBe(false);
    });
  });
});