import { getCollection } from "../config/database";
import { CollectionName } from "../types/common/enums";
import { CreateTeacherRequest, UpdateTeacherRequest, TeacherResponse, User } from "../types/user/request";
import { hashPassword, comparePassword } from "../utils/password.js";
import { ObjectId } from "mongodb";

/**
 * Create a new teacher (role is set to 'teacher')
 */
export const createTeacher = async (teacherData: CreateTeacherRequest): Promise<User | null> => {
  try {
    const collection = getCollection<User>(CollectionName.USERS);

    // Check if teacher already exists by email
    const existingTeacher = await collection.findOne({ email: teacherData.email });
    if (existingTeacher) {
      return null; // Indicate that email already exists
    }

    // Hash password
    const hashedPassword = await hashPassword(teacherData.password);

    const newTeacher = {
      email: teacherData.email,
      password: hashedPassword,
      name: teacherData.name,
      phoneNumber: teacherData.phoneNumber || null,
      role: 'teacher', // Fixed role for teacher
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newTeacher as unknown as User);

    if (result.insertedId) {
      return await collection.findOne({ _id: result.insertedId });
    }

    return null;
  } catch (error) {
    console.error('Error creating teacher:', error);
    return null;
  }
};

/**
 * Get all teachers
 */
export const getAllTeachers = async (): Promise<User[]> => {
  const collection = getCollection<User>(CollectionName.USERS);
  return await collection.find({ role: 'teacher' }).toArray();
};

/**
 * Get teacher by ID
 */
export const getTeacherById = async (id: string): Promise<User | null> => {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const collection = getCollection<User>(CollectionName.USERS);
  return await collection.findOne({ _id: new ObjectId(id), role: 'teacher' });
};

/**
 * Update teacher by ID
 * Note: role cannot be updated via this function
 */
export const updateTeacher = async (id: string, updateData: UpdateTeacherRequest): Promise<User | null> => {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const collection = getCollection<User>(CollectionName.USERS);

  // Check if teacher exists
  const existingTeacher = await collection.findOne({ _id: new ObjectId(id), role: 'teacher' });
  if (!existingTeacher) {
    return null;
  }

  // Prepare update object (only allow certain fields)
  const updateObj: any = {
    updatedAt: new Date()
  };

  if (updateData.email !== undefined) {
    // Check if another teacher has this email
    const emailExists = await collection.findOne({ 
      email: updateData.email, 
      _id: { $ne: new ObjectId(id) },
      role: 'teacher'
    });
    if (emailExists) {
      throw new Error('Email already exists');
    }
    updateObj.email = updateData.email;
  }

  if (updateData.name !== undefined) {
    updateObj.name = updateData.name;
  }

  if (updateData.phoneNumber !== undefined) {
    updateObj.phoneNumber = updateData.phoneNumber;
  }

  // If password is provided in updateData, we would hash it, but our UpdateTeacherRequest doesn't include password
  // For password update, we should have a separate endpoint. So we ignore password here.

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
 * Delete teacher by ID
 */
export const deleteTeacher = async (id: string): Promise<boolean> => {
  if (!ObjectId.isValid(id)) {
    return false;
  }
  const collection = getCollection<User>(CollectionName.USERS);
  const result = await collection.deleteOne({ _id: new ObjectId(id), role: 'teacher' });
  return result.deletedCount === 1;
};