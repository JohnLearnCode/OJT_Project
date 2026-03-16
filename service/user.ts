import { CreateTeacherRequest, UpdateTeacherRequest, TeacherResponse, User } from "../types/user/request";
import * as userModel from '../model/user.js';
import { AuthMessage } from '../types/auth/enum.js';
import { ResponseHelper } from '../utils/response.js';
import { StatusCodes } from 'http-status-codes';

/**
 * Create a new teacher
 */
export const createTeacher = async (teacherData: CreateTeacherRequest): Promise<TeacherResponse> => {
  const teacher = await userModel.createTeacher(teacherData);
  if (!teacher) {
    throw new Error('Email already exists or failed to create teacher');
  }
  // Omit password from response
  const { password, ...teacherWithoutPassword } = teacher;
  return teacherWithoutPassword as TeacherResponse;
};

/**
 * Get all teachers
 */
export const getAllTeachers = async (): Promise<TeacherResponse[]> => {
  const teachers = await userModel.getAllTeachers();
  // Omit password from each teacher
  return teachers.map(({ password, ...rest }) => rest as TeacherResponse);
};

/**
 * Get teacher by ID
 */
export const getTeacherById = async (id: string): Promise<TeacherResponse | null> => {
  const teacher = await userModel.getTeacherById(id);
  if (!teacher) {
    return null;
  }
  const { password, ...teacherWithoutPassword } = teacher;
  return teacherWithoutPassword as TeacherResponse;
};

/**
 * Update teacher by ID
 */
export const updateTeacher = async (id: string, updateData: UpdateTeacherRequest): Promise<TeacherResponse> => {
  const teacher = await userModel.updateTeacher(id, updateData);
  if (!teacher) {
    throw new Error('Teacher not found or update failed');
  }
  const { password, ...teacherWithoutPassword } = teacher;
  return teacherWithoutPassword as TeacherResponse;
};

/**
 * Delete teacher by ID
 */
export const deleteTeacher = async (id: string): Promise<boolean> => {
  const result = await userModel.deleteTeacher(id);
  if (!result) {
    throw new Error('Teacher not found or deletion failed');
  }
  return result;
};