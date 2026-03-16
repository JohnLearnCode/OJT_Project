import { BaseEntity } from '../common/interface.js';
import { ObjectId } from 'mongodb';

/**
 * User Request Types - For User CRUD (Teacher Management)
 */

// We reuse the User entity from auth, but note: we will omit password in responses
export interface User extends BaseEntity {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  role: 'teacher' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// Request to create a teacher (role is fixed to teacher)
export interface CreateTeacherRequest {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
}

// Request to update a teacher (role cannot be updated)
export interface UpdateTeacherRequest {
  email?: string;
  name?: string;
  phoneNumber?: string;
}

// Response for teacher (omits password)
export interface TeacherResponse extends Omit<User, 'password'> { }