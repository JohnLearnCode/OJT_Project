import { Request, Response, NextFunction } from 'express';
import * as userService from '../service/user.js';
import { StatusCodes } from 'http-status-codes';
import { CreateTeacherRequest, UpdateTeacherRequest, TeacherResponse } from '../types/user/request.js';
import { AuthMessage } from '../types/auth/enum.js';
import { ResponseHelper } from '../utils/response.js';

/**
 * Create a new teacher (Admin only)
 */
export const createTeacher = async (
  req: Request<{}, {}, CreateTeacherRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const teacher = await userService.createTeacher(req.body);
    return ResponseHelper.success(
      res,
      AuthMessage.SUCCESS_CREATE,
      teacher,
      StatusCodes.CREATED
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all teachers (Admin only)
 */
export const getAllTeachers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const teachers = await userService.getAllTeachers();
    return ResponseHelper.success(
      res,
      'Teachers retrieved successfully',
      teachers,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get teacher by ID (Admin only)
 */
export const getTeacherById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const teacher = await userService.getTeacherById(req.params.id);
    if (!teacher) {
      return ResponseHelper.error(
        res,
        'Teacher not found',
        undefined,
        StatusCodes.NOT_FOUND
      );
    }
    return ResponseHelper.success(
      res,
      'Teacher retrieved successfully',
      teacher,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update teacher by ID (Admin only)
 */
export const updateTeacher = async (
  req: Request<{ id: string }, {}, UpdateTeacherRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const teacher = await userService.updateTeacher(req.params.id, req.body);
    if (!teacher) {
      return ResponseHelper.error(
        res,
        'Teacher not found or update failed',
        undefined,
        StatusCodes.NOT_FOUND
      );
    }
    return ResponseHelper.success(
      res,
      'Teacher updated successfully',
      teacher,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete teacher by ID (Admin only)
 */
export const deleteTeacher = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const deleted = await userService.deleteTeacher(req.params.id);
    if (!deleted) {
      return ResponseHelper.error(
        res,
        'Teacher not found or deletion failed',
        undefined,
        StatusCodes.NOT_FOUND
      );
    }
    return ResponseHelper.success(
      res,
      'Teacher deleted successfully',
      undefined,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};