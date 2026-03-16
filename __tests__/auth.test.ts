import request from 'supertest';
import app from '../app';
import { TestHelpers } from './utils/testHelpers';

describe('Auth API', () => {
  beforeAll(async () => {
    await TestHelpers.setupTestDB();
  });

  afterAll(async () => {
    await TestHelpers.cleanupTestDB();
  });

  beforeEach(async () => {
    // Clean up before each test
    await TestHelpers.cleanupTestDB();
    await TestHelpers.setupTestDB();
    TestHelpers.resetTokens();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new admin user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'admin@test.com',
          password: 'admin123',
          name: 'Test Admin',
          role: 'admin'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('admin@test.com');
      expect(response.body.data.user.role).toBe('admin');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should register a new teacher user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'teacher@test.com',
          password: 'teacher123',
          name: 'Test Teacher',
          role: 'teacher'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('teacher');
    });

    it('should fail with duplicate email', async () => {
      // Register first time
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@test.com',
          password: 'password123',
          name: 'User One',
          role: 'teacher'
        });

      // Try to register again
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@test.com',
          password: 'password456',
          name: 'User Two',
          role: 'admin'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
          role: 'teacher'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: '123',
          name: 'Test User',
          role: 'teacher'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@test.com',
          password: 'password123',
          name: 'Login User',
          role: 'admin'
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('login@test.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('mật khẩu');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notexist@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
