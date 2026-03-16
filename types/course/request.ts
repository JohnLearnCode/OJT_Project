import { BaseEntity } from '../common/interface.js';
import { ObjectId } from 'mongodb';

/**
 * Course Request Types - For Course CRUD
 */

// Course Entity Interface (reused across layers)
export interface Course extends BaseEntity {
  courseName: string;
  description?: string;
  createdBy: ObjectId; // ID của admin tạo course
  createdAt: Date;
  updatedAt: Date;
}

// Request to create a course
export interface CreateCourseRequest {
  courseName: string;
  description?: string;
}

// Request to update a course (all fields optional)
export interface UpdateCourseRequest {
  courseName?: string;
  description?: string;
}

// Response for course (same as entity but could omit internal fields if needed)
export interface CourseResponse extends Omit<Course, never> { } // just alias