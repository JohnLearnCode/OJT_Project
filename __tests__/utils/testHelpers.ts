import request from 'supertest';
import app from '../../app';
import { connectDB, closeDB } from '../../config/database';
import { getCollection } from '../../config/database';
import { CollectionName } from '../../types/common/enums';

/**
 * Test Helpers - Các hàm tiện ích cho testing
 */

export class TestHelpers {
  private static adminToken: string | null = null;
  private static teacherToken: string | null = null;

  /**
   * Setup test database
   */
  static async setupTestDB() {
    await connectDB();
  }

  /**
   * Cleanup test database
   */
  static async cleanupTestDB() {
    const db = await connectDB();
    
    // Clear all collections
    await db.collection(CollectionName.USERS).deleteMany({});
    await db.collection(CollectionName.COURSES).deleteMany({});
    await db.collection(CollectionName.LOCATIONS).deleteMany({});
    await db.collection(CollectionName.SESSIONS).deleteMany({});
    
    await closeDB();
  }

  /**
   * Get admin token (login or reuse)
   */
  static async getAdminToken(): Promise<string> {
    if (this.adminToken) {
      return this.adminToken;
    }

    // Register admin
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'admin123',
        name: 'Test Admin',
        role: 'admin'
      });

    // Login
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });

    this.adminToken = response.body.data.token;
    return this.adminToken;
  }

  /**
   * Get teacher token (login or reuse)
   */
  static async getTeacherToken(): Promise<string> {
    if (this.teacherToken) {
      return this.teacherToken;
    }

    // Register teacher
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'teacher@test.com',
        password: 'teacher123',
        name: 'Test Teacher',
        role: 'teacher'
      });

    // Login
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teacher@test.com',
        password: 'teacher123'
      });

    this.teacherToken = response.body.data.token;
    return this.teacherToken;
  }

  /**
   * Reset tokens
   */
  static resetTokens() {
    this.adminToken = null;
    this.teacherToken = null;
  }

  /**
   * Create test course
   */
  static async createTestCourse(token: string, data?: Partial<any>) {
    const response = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        courseName: data?.courseName || 'Test Course',
        description: data?.description || 'Test Description'
      });

    return response.body.data;
  }

  /**
   * Create test location
   */
  static async createTestLocation(token: string, data?: Partial<any>) {
    const response = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        room_name: data?.room_name || 'Test Room',
        location: data?.location || 'Test Location'
      });

    return response.body.data;
  }

  /**
   * Create test user (teacher)
   */
  static async createTestTeacher(token: string, data?: Partial<any>) {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: data?.email || 'newteacher@test.com',
        password: data?.password || 'password123',
        name: data?.name || 'New Teacher',
        phoneNumber: data?.phoneNumber || '0123456789'
      });

    return response.body.data;
  }

  /**
   * Wait for async operations
   */
  static async wait(ms: number = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
