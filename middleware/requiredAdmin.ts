import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { ResponseHelper } from '../utils/response';
import { StatusCodes } from 'http-status-codes';

/**
 * Middleware to require admin role
 * Attaches user info to req.user if authorized
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return ResponseHelper.error(
      res,
      'Authorization header is required',
      undefined,
      StatusCodes.UNAUTHORIZED
    );
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  if (!token) {
    return ResponseHelper.error(
      res,
      'Token is required',
      undefined,
      StatusCodes.UNAUTHORIZED
    );
  }

  try {
    // Verify and decode token
    const decoded = verifyAccessToken(token) as JwtPayload;
    
    // Check if user has admin role
    if (decoded.role !== 'admin') {
      return ResponseHelper.error(
        res,
        'Admin access required',
        undefined,
        StatusCodes.FORBIDDEN
      );
    }

    // Attach user info to request for use in controllers
    // Note: decoded contains userId, email, role
    req.user = decoded;
    
    next();
  } catch (error) {
    return ResponseHelper.error(
      res,
      'Invalid or expired token',
      undefined,
      StatusCodes.UNAUTHORIZED
    );
  }
};