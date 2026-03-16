import { getCollection } from "../config/database";
import { CollectionName } from "../types/common/enums";
import { CreateCourseRequest, UpdateCourseRequest, CourseResponse, Course } from "../types/course/request";
import { ObjectId } from "mongodb";

/**
 * Create a new course
 * @param courseData - Course data từ request
 * @param adminId - ID của admin tạo course
 */
export const createCourse = async (courseData: CreateCourseRequest, adminId: string): Promise<Course | null> => {
  try {
    const collection = getCollection<Course>(CollectionName.COURSES);

    // Validate admin ID
    if (!ObjectId.isValid(adminId)) {
      throw new Error('ID admin không hợp lệ');
    }

    // Check if course already exists by name
    const existingCourse = await collection.findOne({ courseName: courseData.courseName });
    if (existingCourse) {
      return null; // Indicate that course name already exists
    }

    const newCourse = {
      courseName: courseData.courseName,
      description: courseData.description || '',
      createdBy: new ObjectId(adminId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newCourse as unknown as Course);

    if (result.insertedId) {
      return await collection.findOne({ _id: result.insertedId });
    }

    return null;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

/**
 * Get all courses
 */
export const getAllCourses = async (): Promise<Course[]> => {
  const collection = getCollection<Course>(CollectionName.COURSES);
  return await collection.find().toArray();
};

/**
 * Get course by ID
 */
export const getCourseById = async (id: string): Promise<Course | null> => {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const collection = getCollection<Course>(CollectionName.COURSES);
  return await collection.findOne({ _id: new ObjectId(id) });
};

/**
 * Update course by ID
 */
export const updateCourse = async (id: string, updateData: UpdateCourseRequest): Promise<Course | null> => {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const collection = getCollection<Course>(CollectionName.COURSES);

  // Check if course exists
  const existingCourse = await collection.findOne({ _id: new ObjectId(id) });
  if (!existingCourse) {
    return null;
  }

  // Prepare update object
  const updateObj: any = {
    updatedAt: new Date()
  };

  if (updateData.courseName !== undefined) {
    // Optionally check if another course has this name
    const nameExists = await collection.findOne({ 
      courseName: updateData.courseName, 
      _id: { $ne: new ObjectId(id) }
    });
    if (nameExists) {
      throw new Error('Course name already exists');
    }
    updateObj.courseName = updateData.courseName;
  }

  if (updateData.description !== undefined) {
    updateObj.description = updateData.description;
  }

  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateObj }
  );

  if (result.modifiedCount === 1) {
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  return null;
};

/**
 * Delete course by ID
 */
export const deleteCourse = async (id: string): Promise<boolean> => {
  if (!ObjectId.isValid(id)) {
    return false;
  }
  const collection = getCollection<Course>(CollectionName.COURSES);
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
};