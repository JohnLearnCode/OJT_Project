import dotenv from 'dotenv';
dotenv.config();

import { connectDB, closeDB } from './config/database';
import { hashPassword } from './utils/password';
import { CollectionName } from './types/common/enums';

/**
 * Seed Data Script - Tạo dữ liệu mẫu cho database
 */

async function seedDatabase() {
  try {
    console.log('\n🌱 Bắt đầu seed data...\n');

    // Kết nối database
    const db = await connectDB();

    // 1. Clear existing data (optional - uncomment nếu muốn xóa data cũ)
    console.log('🗑️  Xóa dữ liệu cũ...');
    await db.collection(CollectionName.USERS).deleteMany({});
    await db.collection(CollectionName.COURSES).deleteMany({});
    await db.collection(CollectionName.LOCATIONS).deleteMany({});
    await db.collection(CollectionName.SESSIONS).deleteMany({});
    console.log('✅ Đã xóa dữ liệu cũ\n');

    // 2. Seed Users (Admin + Teachers)
    console.log('👥 Tạo users...');
    const hashedPassword = await hashPassword('123456');
    
    const users = [
      {
        email: 'admin@evcare.com',
        password: hashedPassword,
        name: 'Admin EVCare',
        phoneNumber: '0901234567',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'teacher1@evcare.com',
        password: hashedPassword,
        name: 'Nguyễn Văn A',
        phoneNumber: '0912345678',
        role: 'teacher',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'teacher2@evcare.com',
        password: hashedPassword,
        name: 'Trần Thị B',
        phoneNumber: '0923456789',
        role: 'teacher',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'teacher3@evcare.com',
        password: hashedPassword,
        name: 'Lê Văn C',
        phoneNumber: '0934567890',
        role: 'teacher',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const userResult = await db.collection(CollectionName.USERS).insertMany(users);
    const userIds = Object.values(userResult.insertedIds);
    console.log(`✅ Đã tạo ${userIds.length} users`);

    // 3. Seed Courses (tất cả được tạo bởi admin)
    console.log('\n📚 Tạo courses...');
    const adminId = userIds[0]; // Admin là user đầu tiên
    
    const courses = [
      {
        courseName: 'Lập trình Web cơ bản',
        description: 'Học HTML, CSS, JavaScript từ cơ bản đến nâng cao',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        courseName: 'React & TypeScript',
        description: 'Xây dựng ứng dụng web hiện đại với React và TypeScript',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        courseName: 'Node.js Backend',
        description: 'Phát triển API và backend với Node.js, Express, MongoDB',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        courseName: 'Database Design',
        description: 'Thiết kế cơ sở dữ liệu SQL và NoSQL',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        courseName: 'DevOps Foundations',
        description: 'CI/CD, Docker, Kubernetes cơ bản',
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const courseResult = await db.collection(CollectionName.COURSES).insertMany(courses);
    const courseIds = Object.values(courseResult.insertedIds);
    console.log(`✅ Đã tạo ${courseIds.length} courses (bởi admin)`);

    // 4. Seed Locations (Rooms)
    console.log('\n📍 Tạo locations/rooms...');
    const locations = [
      {
        room_name: 'Room A101',
        location: 'Tầng 1, Tòa A',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        room_name: 'Room A102',
        location: 'Tầng 1, Tòa A',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        room_name: 'Room A201',
        location: 'Tầng 2, Tòa A',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        room_name: 'Room B101',
        location: 'Tầng 1, Tòa B',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        room_name: 'Lab 301',
        location: 'Tầng 3, Tòa A - Phòng thực hành',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const locationResult = await db.collection(CollectionName.LOCATIONS).insertMany(locations);
    const locationIds = Object.values(locationResult.insertedIds);
    console.log(`✅ Đã tạo ${locationIds.length} locations`);

    // 5. Seed Sessions (Schedules)
    console.log('\n📅 Tạo sessions/schedules...');
    
    // Lấy ngày hiện tại và các ngày tiếp theo
    const today = new Date();
    const getDate = (daysFromNow: number) => {
      const date = new Date(today);
      date.setDate(date.getDate() + daysFromNow);
      return date;
    };

    const timeSlots = ['07:00-09:00', '09:00-11:00', '13:00-15:00', '15:00-17:00'];

    const sessions = [
      // Ngày 1
      {
        session_date: getDate(1),
        starttime: timeSlots[0],
        endtime: timeSlots[0],
        roomid: locationIds[0], // Room A101
        courseid: courseIds[0], // Lập trình Web
        userid: userIds[1], // Teacher 1
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        session_date: getDate(1),
        starttime: timeSlots[1],
        endtime: timeSlots[1],
        roomid: locationIds[1], // Room A102
        courseid: courseIds[1], // React
        userid: userIds[2], // Teacher 2
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        session_date: getDate(1),
        starttime: timeSlots[2],
        endtime: timeSlots[2],
        roomid: locationIds[0], // Room A101
        courseid: courseIds[2], // Node.js
        userid: userIds[3], // Teacher 3
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Ngày 2
      {
        session_date: getDate(2),
        starttime: timeSlots[0],
        endtime: timeSlots[0],
        roomid: locationIds[2], // Room A201
        courseid: courseIds[3], // Database
        userid: userIds[1], // Teacher 1
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        session_date: getDate(2),
        starttime: timeSlots[1],
        endtime: timeSlots[1],
        roomid: locationIds[3], // Room B101
        courseid: courseIds[4], // DevOps
        userid: userIds[2], // Teacher 2
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        session_date: getDate(2),
        starttime: timeSlots[3],
        endtime: timeSlots[3],
        roomid: locationIds[4], // Lab 301
        courseid: courseIds[0], // Lập trình Web
        userid: userIds[3], // Teacher 3
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Ngày 3
      {
        session_date: getDate(3),
        starttime: timeSlots[0],
        endtime: timeSlots[0],
        roomid: locationIds[0], // Room A101
        courseid: courseIds[1], // React
        userid: userIds[1], // Teacher 1
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        session_date: getDate(3),
        starttime: timeSlots[2],
        endtime: timeSlots[2],
        roomid: locationIds[1], // Room A102
        courseid: courseIds[2], // Node.js
        userid: userIds[2], // Teacher 2
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const sessionResult = await db.collection(CollectionName.SESSIONS).insertMany(sessions);
    const sessionIds = Object.values(sessionResult.insertedIds);
    console.log(`✅ Đã tạo ${sessionIds.length} sessions`);

    // Summary
    console.log('\n✅ SEED DATA HOÀN TẤT!\n');
    console.log('📊 Tổng kết:');
    console.log(`   👥 Users: ${userIds.length}`);
    console.log(`      - Admin: 1 (admin@evcare.com / 123456)`);
    console.log(`      - Teachers: ${userIds.length - 1}`);
    console.log(`   📚 Courses: ${courseIds.length}`);
    console.log(`   📍 Locations: ${locationIds.length}`);
    console.log(`   📅 Sessions: ${sessionIds.length}`);
    console.log('\n💡 Thông tin đăng nhập:');
    console.log('   Email: admin@evcare.com');
    console.log('   Password: 123456');
    console.log('\n🚀 Bắt đầu server: npm start');
    console.log('📚 Swagger UI: http://localhost:3000/api-docs\n');

    await closeDB();
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Lỗi khi seed data:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Chạy seed
seedDatabase();
