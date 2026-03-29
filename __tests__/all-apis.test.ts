import request from 'supertest';
import app from '../app';
import { TestHelpers } from './utils/testHelpers';

describe('All APIs Integration Tests', () => {
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

  describe('User API (Teacher Management)', () => {
    it('should create teacher with admin token', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newteacher@test.com',
          password: 'teacher123',
          name: 'New Teacher',
          phoneNumber: '0123456789'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('teacher');
    });

    it('should get all teachers', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail creating teacher with teacher token', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          email: 'another@test.com',
          password: 'password123',
          name: 'Another Teacher'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Location API', () => {
    it('should create location with admin token', async () => {
      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          room_name: 'Room A101',
          location: 'Building A, Floor 1'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.room_name).toBe('Room A101');
    });

    it('should get all locations', async () => {
      await TestHelpers.createTestLocation(adminToken);

      const response = await request(app)
        .get('/api/locations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should update location', async () => {
      const location = await TestHelpers.createTestLocation(adminToken);

      const response = await request(app)
        .put(`/api/locations/${location._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          room_name: 'Updated Room'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.room_name).toBe('Updated Room');
    });

    it('should delete location', async () => {
      const location = await TestHelpers.createTestLocation(adminToken);

      const response = await request(app)
        .delete(`/api/locations/${location._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Session API - Business Logic', () => {
    let course: any;
    let room1: any;
    let room2: any;
    let teacher1: any;

    beforeEach(async () => {
      course = await TestHelpers.createTestCourse(adminToken);
      room1 = await TestHelpers.createTestLocation(adminToken, {
        room_name: 'Room A101'
      });
      room2 = await TestHelpers.createTestLocation(adminToken, {
        room_name: 'Room A102'
      });
      
      // Get teacher ID from token
      const teacherResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      teacher1 = teacherResponse.body.data.find((u: any) => u.role === 'teacher');
    });

    it('should create session successfully', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          session_date: '2026-03-25',
          time: '09:00-11:00',
          roomid: room1._id,
          courseid: course._id,
          userid: teacher1._id
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should fail with teacher conflict (same teacher, same time)', async () => {
      // Create first session
      await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          session_date: '2026-03-25',
          time: '09:00-11:00',
          roomid: room1._id,
          courseid: course._id,
          userid: teacher1._id
        });

      // Try to create another session with same teacher, same time
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          session_date: '2026-03-25',
          time: '09:00-11:00',
          roomid: room2._id, // Different room
          courseid: course._id,
          userid: teacher1._id // Same teacher
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Giáo viên');
    });

    it('should fail with room conflict (same room, same time)', async () => {
      // Create first session
      await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          session_date: '2026-03-25',
          time: '09:00-11:00',
          roomid: room1._id,
          courseid: course._id,
          userid: teacher1._id
        });

      // Try same room, same time
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          session_date: '2026-03-25',
          time: '09:00-11:00',
          roomid: room1._id, // Same room
          courseid: course._id,
          userid: teacher1._id
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Phòng');
    });

    it('should allow course at same time in different rooms', async () => {
      // Create first session
      await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          session_date: '2026-03-25',
          time: '09:00-11:00',
          roomid: room1._id,
          courseid: course._id,
          userid: teacher1._id
        });

      // Create another teacher
      const teacher2Response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'teacher2@test.com',
          password: 'password123',
          name: 'Teacher 2'
        });
      const teacher2 = teacher2Response.body.data;

      // Same course, same time, DIFFERENT room
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          session_date: '2026-03-25',
          time: '09:00-11:00',
          roomid: room2._id, // Different room
          courseid: course._id, // Same course
          userid: teacher2._id // Different teacher
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should fail with invalid time slot', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          session_date: '2026-03-25',
          time: '10:00-12:00', // Invalid
          roomid: room1._id,
          courseid: course._id,
          userid: teacher1._id
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Khung giờ');
    });
  });
});
