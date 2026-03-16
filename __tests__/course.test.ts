import request from 'supertest';
import app from '../app';
import { TestHelpers } from './utils/testHelpers';

describe('Course API', () => {
  let adminToken: string;
  let teacherToken: string;

  beforeAll(async () => {
    await TestHelpers.setupTestDB();
  });

  afterAll(async () => {
    await TestHelpers.cleanupTestDB();
  });

  beforeEach(async () => {
    await TestHelpers.cleanupTestDB();
    await TestHelpers.setupTestDB();
    TestHelpers.resetTokens();
    adminToken = await TestHelpers.getAdminToken();
    teacherToken = await TestHelpers.getTeacherToken();
  });

  describe('POST /api/courses', () => {
    it('should create course with admin token', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseName: 'Test Course',
          description: 'Test Description'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('createdBy');
      expect(response.body.data.courseName).toBe('Test Course');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/api/courses')
        .send({
          courseName: 'Test Course',
          description: 'Test Description'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with teacher token (not admin)', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          courseName: 'Test Course',
          description: 'Test Description'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with duplicate course name', async () => {
      await TestHelpers.createTestCourse(adminToken, {
        courseName: 'Duplicate Course'
      });

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseName: 'Duplicate Course',
          description: 'Another Description'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/courses', () => {
    it('should get all courses with admin token', async () => {
      await TestHelpers.createTestCourse(adminToken, {
        courseName: 'Course 1'
      });
      await TestHelpers.createTestCourse(adminToken, {
        courseName: 'Course 2'
      });

      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should fail without token', async () => {
      const response = await request(app).get('/api/courses');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should get course by id', async () => {
      const course = await TestHelpers.createTestCourse(adminToken);

      const response = await request(app)
        .get(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(course._id);
      expect(response.body.data.courseName).toBe(course.courseName);
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(app)
        .get('/api/courses/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/courses/:id', () => {
    it('should update course', async () => {
      const course = await TestHelpers.createTestCourse(adminToken);

      const response = await request(app)
        .put(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseName: 'Updated Course Name',
          description: 'Updated Description'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.courseName).toBe('Updated Course Name');
      expect(response.body.data.description).toBe('Updated Description');
    });

    it('should fail updating to duplicate name', async () => {
      await TestHelpers.createTestCourse(adminToken, {
        courseName: 'Existing Course'
      });
      const course = await TestHelpers.createTestCourse(adminToken, {
        courseName: 'Another Course'
      });

      const response = await request(app)
        .put(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseName: 'Existing Course'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/courses/:id', () => {
    it('should delete course', async () => {
      const course = await TestHelpers.createTestCourse(adminToken);

      const response = await request(app)
        .delete(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deleted
      const getResponse = await request(app)
        .get(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent course', async () => {
      const response = await request(app)
        .delete('/api/courses/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
