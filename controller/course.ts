import { Request, Response, NextFunction } from 'express';
import * as courseService from '../service/course.js';
import { StatusCodes } from 'http-status-codes';
import { CreateCourseRequest, UpdateCourseRequest, CourseResponse } from '../types/course/request.js';
import { AuthMessage } from '../types/auth/enum.js';
import { ResponseHelper } from '../utils/response.js';
import { JwtPayload } from '../utils/jwt.js';

/**
 * Create a new course (Admin only)
 */
export const createCourse = async (
  req: Request<{}, {}, CreateCourseRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get admin ID from authenticated user (req.user được set bởi requireAuth middleware)
    const user = req.user as JwtPayload;
    const adminId = user?.userId;
    
    if (!adminId) {
      return ResponseHelper.error(
        res,
        'Không xác định được thông tin admin',
        undefined,
        StatusCodes.UNAUTHORIZED
      );
    }

    const course = await courseService.createCourse(req.body, adminId);
    return ResponseHelper.success(
      res,
      'Tạo khóa học thành công',
      course,
      StatusCodes.CREATED
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all courses (Admin only)
 */
export const getAllCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const courses = await courseService.getAllCourses();
    return ResponseHelper.success(
      res,
      'Courses retrieved successfully',
      courses,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get course by ID (Admin only)
 */
export const getCourseById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    if (!course) {
      return ResponseHelper.error(
        res,
        'Course not found',
        undefined,
        StatusCodes.NOT_FOUND
      );
    }
    return ResponseHelper.success(
      res,
      'Course retrieved successfully',
      course,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update course by ID (Admin only)
 */
export const updateCourse = async (
  req: Request<{ id: string }, {}, UpdateCourseRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body);
    if (!course) {
      return ResponseHelper.error(
        res,
        'Course not found or update failed',
        undefined,
        StatusCodes.NOT_FOUND
      );
    }
    return ResponseHelper.success(
      res,
      'Course updated successfully',
      course,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete course by ID (Admin only)
 */
export const deleteCourse = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const deleted = await courseService.deleteCourse(req.params.id);
    if (!deleted) {
      return ResponseHelper.error(
        res,
        'Course not found or deletion failed',
        undefined,
        StatusCodes.NOT_FOUND
      );
    }
    return ResponseHelper.success(
      res,
      'Course deleted successfully',
      undefined,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};