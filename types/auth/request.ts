import { BaseEntity } from '../common/interface.js';
import { ObjectId } from 'mongodb';

/**
 * Auth Request Types - Input Data
 */

// User Entity Interface

export interface User extends BaseEntity {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  role: 'teacher' | 'admin';
}

// Create User Request
export interface RegisterUserRequest {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  role: 'teacher' | 'admin';
}

export interface LoginAuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

// Logout Request
export interface LogoutAuthRequest { }



