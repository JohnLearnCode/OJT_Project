import { RegisterUserRequest, LoginAuthRequest, User, AuthResponse } from "../types/auth/request";
import * as authModel from '../model/auth.js'
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { comparePassword } from '../utils/password.js';

export const registerAuth = async (authData: RegisterUserRequest): Promise<AuthResponse> => {
  // Check if user already exists by email
  const existingUserByEmail = await authModel.findUserByEmail(authData.email);
  if (existingUserByEmail) {
    throw new Error('Email đã được sử dụng');
  }

  // Check if phone number already exists
  if (authData.phoneNumber) {
    const existingUserByPhone = await authModel.findUserByPhoneNumber(authData.phoneNumber);
    if (existingUserByPhone) {
      throw new Error('Số điện thoại đã được sử dụng');
    }
  }

  const registerUser = await authModel.registerAuth(authData);

  if (!registerUser) {
    throw new Error('Không thể tạo tài khoản người dùng');
  }

  // Generate tokens
  const accessToken = generateAccessToken(registerUser);
  const refreshToken = generateRefreshToken(registerUser);

  // Return user without password
  const { password, ...userWithoutPassword } = registerUser;

  return {
    user: userWithoutPassword as User,
    token: accessToken
  };
};

export const loginAuth = async (authData: LoginAuthRequest): Promise<AuthResponse> => {
  // Find user by email
  const user = await authModel.findUserByEmail(authData.email);
  if (!user) {
    throw new Error('Email hoặc mật khẩu không đúng');
  }

  // Compare password
  const isPasswordValid = await comparePassword(authData.password, user.password);
  if (!isPasswordValid) {
    throw new Error('Email hoặc mật khẩu không đúng');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Return user without password
  const { password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword as User,
    token: accessToken
  };
};

export const logoutAuth = async (): Promise<void> => {
  // In a more advanced system, we would invalidate the token here (e.g., add to a blacklist in Redis or DB)
  // For now, we just return success and let the client handle token removal.
  return;
};