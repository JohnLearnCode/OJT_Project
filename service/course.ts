import { CreateCourseRequest, UpdateCourseRequest, CourseResponse, Course } from "../types/course/request";
import * as courseModel from '../model/course.js';
import { AuthMessage } from '../types/auth/enum.js';
import { ResponseHelper } from '../utils/response.js';
import { StatusCodes } from 'http-status-codes';

/**
 * Create a new course
 * @param courseData - Dữ liệu course
 * @param adminId - ID của admin tạo course
 */
export const createCourse = async (courseData: CreateCourseRequest, adminId: string): Promise<CourseResponse> => {
  const course = await courseModel.createCourse(courseData, adminId);
  if (!course) {
    throw new Error('Tên khóa học đã tồn tại hoặc không thể tạo khóa học');
  }
  return course as CourseResponse;
};

/**
 * Get all courses
 */
export const getAllCourses = async (): Promise<CourseResponse[]> => {
  const courses = await courseModel.getAllCourses();
  return courses as CourseResponse[];
};

/**
 * Get course by ID
 */
export const getCourseById = async (id: string): Promise<CourseResponse | null> => {
  const course = await courseModel.getCourseById(id);
  if (!course) {
    return null;
  }
  return course as CourseResponse;
};

/**
 * Update course by ID
 */
export const updateCourse = async (id: string, updateData: UpdateCourseRequest): Promise<CourseResponse> => {
  const course = await courseModel.updateCourse(id, updateData);
  if (!course) {
    throw new Error('Course not found or update failed');
  }
  return course as CourseResponse;
};

/**
 * Delete course by ID
 */
export const deleteCourse = async (id: string): Promise<boolean> => {
  const result = await courseModel.deleteCourse(id);
  if (!result) {
    throw new Error('Course not found or deletion failed');
  }
  return result;
};