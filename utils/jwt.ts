import jwt, { JwtPayload as JsonWebTokenPayload } from "jsonwebtoken"
import { User } from '../types/auth/request.js';

const getAccessTokenSecret = (): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  return secret;
}

const getRefreshTokenSecret = (): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key-change-in-production';
  return secret;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'teacher' | 'admin';
}

export const generateAccessToken = (user: User): string => {
  const payload: JwtPayload = {
    userId: user._id?.toString() || '',
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, getAccessTokenSecret(), { expiresIn: '10h' })
}

export const generateRefreshToken = (user: User): string => {
  const payload: JwtPayload = {
    userId: user._id?.toString() || '',
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, getRefreshTokenSecret(), { expiresIn: '7d' })
}

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, getAccessTokenSecret()) as JwtPayload;
}

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, getRefreshTokenSecret()) as JwtPayload;
}

export const decodeToken = (token: string): JsonWebTokenPayload | string | null => {
  return jwt.decode(token);
}

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
