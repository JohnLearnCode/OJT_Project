import { getCollection } from "../config/database";
import { CollectionName } from "../types/common/enums";
import { CreateSessionRequest, UpdateSessionRequest, SessionResponse, Session } from "../types/session/request";
import { ObjectId } from "mongodb";

/**
 * Validate if a time string is one of the allowed slots: 
 * '07:00-09:00', '09:00-11:00', '13:00-15:00', '15:00-17:00'
 */
const isValidTimeSlot = (timeSlot: string): boolean => {
  const validSlots = ['07:00-09:00', '09:00-11:00', '13:00-15:00', '15:00-17:00'];
  return validSlots.includes(timeSlot);
};

/**
 * Normalize date to start of day (00:00:00) để so sánh chính xác
 */
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

/**
 * Check if teacher has conflict on the same date and time slot
 */
const checkTeacherConflict = async (
  teacherId: ObjectId,
  sessionDate: Date,
  timeSlot: string,
  excludeSessionId?: ObjectId
): Promise<boolean> => {
  const collection = getCollection<Session>(CollectionName.SESSIONS);
  
  const normalizedDate = normalizeDate(sessionDate);
  
  const query: any = {
    userid: teacherId,
    session_date: normalizedDate,
    starttime: timeSlot,
  };

  // Exclude current session if updating
  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  const existingSession = await collection.findOne(query);
  return !!existingSession;
};

/**
 * Check if course exceeds maximum sessions per day (2 sessions max)
 */
const checkCourseDailyLimit = async (
  courseId: ObjectId,
  sessionDate: Date,
  excludeSessionId?: ObjectId
): Promise<{ isValid: boolean; count: number }> => {
  const collection = getCollection<Session>(CollectionName.SESSIONS);
  
  const normalizedDate = normalizeDate(sessionDate);
  
  const query: any = {
    courseid: courseId,
    session_date: normalizedDate,
  };

  // Exclude current session if updating
  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  const count = await collection.countDocuments(query);
  
  return {
    isValid: count < 2, // Chỉ cho phép tối đa 2 buổi/ngày
    count: count
  };
};

/**
 * Check if course has conflict in the same location at the same time
 * Course ĐƯỢC PHÉP trùng thời gian nếu ở location (room) khác nhau
 * Course KHÔNG ĐƯỢC trùng thời gian trong cùng 1 location
 */
const checkCourseLocationConflict = async (
  courseId: ObjectId,
  roomId: ObjectId,
  sessionDate: Date,
  timeSlot: string,
  excludeSessionId?: ObjectId
): Promise<boolean> => {
  const collection = getCollection<Session>(CollectionName.SESSIONS);
  
  const normalizedDate = normalizeDate(sessionDate);
  
  const query: any = {
    courseid: courseId,
    roomid: roomId,
    session_date: normalizedDate,
    starttime: timeSlot,
  };

  // Exclude current session if updating
  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  const existingSession = await collection.findOne(query);
  return !!existingSession;
};

/**
 * Check if room is available at the specified date and time
 */
const checkRoomConflict = async (
  roomId: ObjectId,
  sessionDate: Date,
  timeSlot: string,
  excludeSessionId?: ObjectId
): Promise<boolean> => {
  const collection = getCollection<Session>(CollectionName.SESSIONS);
  
  const normalizedDate = normalizeDate(sessionDate);
  
  const query: any = {
    roomid: roomId,
    session_date: normalizedDate,
    starttime: timeSlot,
  };

  // Exclude current session if updating
  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  const existingSession = await collection.findOne(query);
  return !!existingSession;
};

/**
 * Create a new session với business logic validation
 */
export const createSession = async (sessionData: CreateSessionRequest): Promise<Session | null> => {
  try {
    const collection = getCollection<Session>(CollectionName.SESSIONS);

    // 1. Validate time slots
    if (!isValidTimeSlot(sessionData.starttime)) {
      throw new Error('Khung giờ bắt đầu không hợp lệ. Chỉ được chọn: 07:00-09:00, 09:00-11:00, 13:00-15:00, 15:00-17:00');
    }

    if (!isValidTimeSlot(sessionData.endtime)) {
      throw new Error('Khung giờ kết thúc không hợp lệ. Chỉ được chọn: 07:00-09:00, 09:00-11:00, 13:00-15:00, 15:00-17:00');
    }

    // Starttime và endtime phải giống nhau (mỗi session chỉ 1 time slot)
    if (sessionData.starttime !== sessionData.endtime) {
      throw new Error('Khung giờ bắt đầu và kết thúc phải giống nhau. Mỗi buổi học là 1 khung giờ cố định');
    }

    // 2. Check if session_date is valid
    const sessionDate = new Date(sessionData.session_date);
    if (isNaN(sessionDate.getTime())) {
      throw new Error('Ngày học không hợp lệ');
    }

    const normalizedDate = normalizeDate(sessionDate);

    // 3. Validate referenced documents exist
    // Check room
    const locationCollection = getCollection<{ _id: ObjectId; room_name?: string }>(CollectionName.LOCATIONS);
    if (!ObjectId.isValid(sessionData.roomid)) {
      throw new Error('ID phòng học không hợp lệ');
    }
    const room = await locationCollection.findOne({ _id: new ObjectId(sessionData.roomid) });
    if (!room) {
      throw new Error('Phòng học không tồn tại');
    }

    // Check course
    const courseCollection = getCollection<{ _id: ObjectId; courseName?: string }>(CollectionName.COURSES);
    if (!ObjectId.isValid(sessionData.courseid)) {
      throw new Error('ID khóa học không hợp lệ');
    }
    const course = await courseCollection.findOne({ _id: new ObjectId(sessionData.courseid) });
    if (!course) {
      throw new Error('Khóa học không tồn tại');
    }

    // Check teacher
    const userCollection = getCollection<{ _id: ObjectId; name?: string; role?: string }>(CollectionName.USERS);
    if (!ObjectId.isValid(sessionData.userid)) {
      throw new Error('ID giáo viên không hợp lệ');
    }
    const teacher = await userCollection.findOne({ _id: new ObjectId(sessionData.userid) });
    if (!teacher) {
      throw new Error('Giáo viên không tồn tại');
    }

    const teacherId = new ObjectId(sessionData.userid);
    const courseId = new ObjectId(sessionData.courseid);
    const roomId = new ObjectId(sessionData.roomid);
    const timeSlot = sessionData.starttime;

    // 4. BUSINESS LOGIC VALIDATIONS

    // Check 1: Teacher conflict - Giáo viên có bị trùng lịch không?
    const hasTeacherConflict = await checkTeacherConflict(teacherId, normalizedDate, timeSlot);
    if (hasTeacherConflict) {
      throw new Error(
        `Giáo viên "${teacher.name}" đã có lịch dạy vào khung giờ ${timeSlot} ngày ${normalizedDate.toLocaleDateString('vi-VN')}. Vui lòng chọn giáo viên khác hoặc khung giờ khác`
      );
    }

    // Check 2: Room conflict - Phòng học có bị trùng không?
    const hasRoomConflict = await checkRoomConflict(roomId, normalizedDate, timeSlot);
    if (hasRoomConflict) {
      throw new Error(
        `Phòng "${room.room_name}" đã được sử dụng vào khung giờ ${timeSlot} ngày ${normalizedDate.toLocaleDateString('vi-VN')}. Vui lòng chọn phòng khác`
      );
    }

    // Check 3: Course daily limit - Khóa học có vượt quá 2 buổi/ngày không?
    const courseDailyLimit = await checkCourseDailyLimit(courseId, normalizedDate);
    if (!courseDailyLimit.isValid) {
      throw new Error(
        `Khóa học "${course.courseName}" đã đạt giới hạn tối đa 2 buổi học trong ngày ${normalizedDate.toLocaleDateString('vi-VN')}. Không thể tạo thêm buổi học`
      );
    }

    // Check 4: Course + Location conflict - Khóa học có bị trùng trong cùng 1 phòng không?
    // Course ĐƯỢC PHÉP trùng thời gian nếu ở location khác nhau
    const hasCourseLocationConflict = await checkCourseLocationConflict(courseId, roomId, normalizedDate, timeSlot);
    if (hasCourseLocationConflict) {
      throw new Error(
        `Khóa học "${course.courseName}" đã có lịch học tại phòng "${room.room_name}" vào khung giờ ${timeSlot} ngày ${normalizedDate.toLocaleDateString('vi-VN')}. Vui lòng chọn phòng khác hoặc khung giờ khác`
      );
    }

    // 5. All validations passed - Create session
    const newSession = {
      session_date: normalizedDate,
      starttime: sessionData.starttime,
      endtime: sessionData.endtime,
      roomid: roomId,
      courseid: courseId,
      userid: teacherId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newSession as unknown as Session);

    if (result.insertedId) {
      return await collection.findOne({ _id: result.insertedId });
    }

    return null;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error; // Re-throw to let service/controller handle it
  }
};

/**
 * Get all sessions
 */
export const getAllSessions = async (): Promise<Session[]> => {
  const collection = getCollection<Session>(CollectionName.SESSIONS);
  return await collection.find().toArray();
};

/**
 * Get session by ID
 */
export const getSessionById = async (id: string): Promise<Session | null> => {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const collection = getCollection<Session>(CollectionName.SESSIONS);
  return await collection.findOne({ _id: new ObjectId(id) });
};

/**
 * Update session by ID với business logic validation
 */
export const updateSession = async (id: string, updateData: UpdateSessionRequest): Promise<Session | null> => {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  
  const collection = getCollection<Session>(CollectionName.SESSIONS);

  // Check if session exists
  const existingSession = await collection.findOne({ _id: new ObjectId(id) });
  if (!existingSession) {
    return null;
  }

  // Prepare update object
  const updateObj: any = {
    updatedAt: new Date()
  };

  // 1. Validate and update session_date if provided
  if (updateData.session_date !== undefined) {
    const sessionDate = new Date(updateData.session_date);
    if (isNaN(sessionDate.getTime())) {
      throw new Error('Ngày học không hợp lệ');
    }
    updateObj.session_date = normalizeDate(sessionDate);
  }

  // 2. Validate and update starttime if provided
  if (updateData.starttime !== undefined) {
    if (!isValidTimeSlot(updateData.starttime)) {
      throw new Error('Khung giờ bắt đầu không hợp lệ. Chỉ được chọn: 07:00-09:00, 09:00-11:00, 13:00-15:00, 15:00-17:00');
    }
    updateObj.starttime = updateData.starttime;
  }

  // 3. Validate and update endtime if provided
  if (updateData.endtime !== undefined) {
    if (!isValidTimeSlot(updateData.endtime)) {
      throw new Error('Khung giờ kết thúc không hợp lệ. Chỉ được chọn: 07:00-09:00, 09:00-11:00, 13:00-15:00, 15:00-17:00');
    }
    updateObj.endtime = updateData.endtime;
  }

  // Check starttime và endtime phải giống nhau
  const starttime = updateObj.starttime ?? existingSession.starttime;
  const endtime = updateObj.endtime ?? existingSession.endtime;
  if (starttime !== endtime) {
    throw new Error('Khung giờ bắt đầu và kết thúc phải giống nhau. Mỗi buổi học là 1 khung giờ cố định');
  }

  // 4. Validate and update roomid if provided
  let room: any = null;
  if (updateData.roomid !== undefined) {
    if (!ObjectId.isValid(updateData.roomid)) {
      throw new Error('ID phòng học không hợp lệ');
    }
    const locationCollection = getCollection<{ _id: ObjectId; room_name?: string }>(CollectionName.LOCATIONS);
    room = await locationCollection.findOne({ _id: new ObjectId(updateData.roomid) });
    if (!room) {
      throw new Error('Phòng học không tồn tại');
    }
    updateObj.roomid = new ObjectId(updateData.roomid);
  }

  // 5. Validate and update courseid if provided
  let course: any = null;
  if (updateData.courseid !== undefined) {
    if (!ObjectId.isValid(updateData.courseid)) {
      throw new Error('ID khóa học không hợp lệ');
    }
    const courseCollection = getCollection<{ _id: ObjectId; courseName?: string }>(CollectionName.COURSES);
    course = await courseCollection.findOne({ _id: new ObjectId(updateData.courseid) });
    if (!course) {
      throw new Error('Khóa học không tồn tại');
    }
    updateObj.courseid = new ObjectId(updateData.courseid);
  }

  // 6. Validate and update userid if provided
  let teacher: any = null;
  if (updateData.userid !== undefined) {
    if (!ObjectId.isValid(updateData.userid)) {
      throw new Error('ID giáo viên không hợp lệ');
    }
    const userCollection = getCollection<{ _id: ObjectId; name?: string }>(CollectionName.USERS);
    teacher = await userCollection.findOne({ _id: new ObjectId(updateData.userid) });
    if (!teacher) {
      throw new Error('Giáo viên không tồn tại');
    }
    updateObj.userid = new ObjectId(updateData.userid);
  }

  // Get final values (after update or keep existing)
  const sessionDate = updateObj.session_date ?? existingSession.session_date;
  const timeSlot = starttime;
  const roomId = updateObj.roomid ?? existingSession.roomid;
  const courseId = updateObj.courseid ?? existingSession.courseid;
  const teacherId = updateObj.userid ?? existingSession.userid;
  const sessionObjectId = new ObjectId(id);

  // 7. BUSINESS LOGIC VALIDATIONS (only if relevant fields changed)

  // Check teacher conflict (if teacher, date, or time changed)
  if (updateData.userid || updateData.session_date || updateData.starttime) {
    // Fetch teacher name if not already fetched
    if (!teacher) {
      const userCollection = getCollection<{ _id: ObjectId; name?: string }>(CollectionName.USERS);
      teacher = await userCollection.findOne({ _id: teacherId });
    }

    const hasTeacherConflict = await checkTeacherConflict(
      teacherId,
      sessionDate,
      timeSlot,
      sessionObjectId
    );

    if (hasTeacherConflict) {
      throw new Error(
        `Giáo viên "${teacher?.name}" đã có lịch dạy vào khung giờ ${timeSlot} ngày ${sessionDate.toLocaleDateString('vi-VN')}. Vui lòng chọn giáo viên khác hoặc khung giờ khác`
      );
    }
  }

  // Check room conflict (if room, date, or time changed)
  if (updateData.roomid || updateData.session_date || updateData.starttime) {
    // Fetch room name if not already fetched
    if (!room) {
      const locationCollection = getCollection<{ _id: ObjectId; room_name?: string }>(CollectionName.LOCATIONS);
      room = await locationCollection.findOne({ _id: roomId });
    }

    const hasRoomConflict = await checkRoomConflict(
      roomId,
      sessionDate,
      timeSlot,
      sessionObjectId
    );

    if (hasRoomConflict) {
      throw new Error(
        `Phòng "${room?.room_name}" đã được sử dụng vào khung giờ ${timeSlot} ngày ${sessionDate.toLocaleDateString('vi-VN')}. Vui lòng chọn phòng khác`
      );
    }
  }

  // Check course daily limit (if course or date changed)
  if (updateData.courseid || updateData.session_date) {
    // Fetch course name if not already fetched
    if (!course) {
      const courseCollection = getCollection<{ _id: ObjectId; courseName?: string }>(CollectionName.COURSES);
      course = await courseCollection.findOne({ _id: courseId });
    }

    const courseDailyLimit = await checkCourseDailyLimit(courseId, sessionDate, sessionObjectId);
    if (!courseDailyLimit.isValid) {
      throw new Error(
        `Khóa học "${course?.courseName}" đã đạt giới hạn tối đa 2 buổi học trong ngày ${sessionDate.toLocaleDateString('vi-VN')}. Không thể cập nhật session`
      );
    }
  }

  // Check course + location conflict (if course, room, date, or time changed)
  if (updateData.courseid || updateData.roomid || updateData.session_date || updateData.starttime) {
    // Fetch course name if not already fetched
    if (!course) {
      const courseCollection = getCollection<{ _id: ObjectId; courseName?: string }>(CollectionName.COURSES);
      course = await courseCollection.findOne({ _id: courseId });
    }

    // Fetch room name if not already fetched
    if (!room) {
      const locationCollection = getCollection<{ _id: ObjectId; room_name?: string }>(CollectionName.LOCATIONS);
      room = await locationCollection.findOne({ _id: roomId });
    }

    const hasCourseLocationConflict = await checkCourseLocationConflict(
      courseId,
      roomId,
      sessionDate,
      timeSlot,
      sessionObjectId
    );

    if (hasCourseLocationConflict) {
      throw new Error(
        `Khóa học "${course?.courseName}" đã có lịch học tại phòng "${room?.room_name}" vào khung giờ ${timeSlot} ngày ${sessionDate.toLocaleDateString('vi-VN')}. Vui lòng chọn phòng khác hoặc khung giờ khác`
      );
    }
  }

  // 8. All validations passed - Update session
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateObj }
  );

  if (result.modifiedCount === 1 || result.matchedCount === 1) {
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  return null;
};

/**
 * Delete session by ID
 */
export const deleteSession = async (id: string): Promise<boolean> => {
  if (!ObjectId.isValid(id)) {
    return false;
  }
  const collection = getCollection<Session>(CollectionName.SESSIONS);
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
};