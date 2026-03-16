import { Request, Response, NextFunction } from 'express';
import * as locationService from '../service/location.js';
import { StatusCodes } from 'http-status-codes';
import { CreateLocationRequest, UpdateLocationRequest, LocationResponse } from '../types/location/request.js';
import { AuthMessage } from '../types/auth/enum.js';
import { ResponseHelper } from '../utils/response.js';

/**
 * Create a new location (Admin only)
 */
export const createLocation = async (
  req: Request<{}, {}, CreateLocationRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const location = await locationService.createLocation(req.body);
    return ResponseHelper.success(
      res,
      AuthMessage.SUCCESS_CREATE,
      location,
      StatusCodes.CREATED
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all locations (Admin only)
 */
export const getAllLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const locations = await locationService.getAllLocations();
    return ResponseHelper.success(
      res,
      'Locations retrieved successfully',
      locations,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get location by ID (Admin only)
 */
export const getLocationById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const location = await locationService.getLocationById(req.params.id);
    if (!location) {
      return ResponseHelper.error(
        res,
        'Location not found',
        undefined,
        StatusCodes.NOT_FOUND
      );
    }
    return ResponseHelper.success(
      res,
      'Location retrieved successfully',
      location,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update location by ID (Admin only)
 */
export const updateLocation = async (
  req: Request<{ id: string }, {}, UpdateLocationRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const location = await locationService.updateLocation(req.params.id, req.body);
    if (!location) {
      return ResponseHelper.error(
        res,
        'Location not found or update failed',
        undefined,
        StatusCodes.NOT_FOUND
      );
    }
    return ResponseHelper.success(
      res,
      'Location updated successfully',
      location,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete location by ID (Admin only)
 */
export const deleteLocation = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const deleted = await locationService.deleteLocation(req.params.id);
    if (!deleted) {
      return ResponseHelper.error(
        res,
        'Location not found or deletion failed',
        undefined,
        StatusCodes.NOT_FOUND
      );
    }
    return ResponseHelper.success(
      res,
      'Location deleted successfully',
      undefined,
      StatusCodes.OK
    );
  } catch (error) {
    next(error);
  }
};