import { CreateLocationRequest, UpdateLocationRequest, LocationResponse, Location } from "../types/location/request";
import * as locationModel from '../model/location.js';
import { AuthMessage } from '../types/auth/enum.js';
import { ResponseHelper } from '../utils/response.js';
import { StatusCodes } from 'http-status-codes';

/**
 * Create a new location
 */
export const createLocation = async (locationData: CreateLocationRequest): Promise<LocationResponse> => {
  const location = await locationModel.createLocation(locationData);
  if (!location) {
    throw new Error('Location with this room name already exists or failed to create location');
  }
  return location as LocationResponse;
};

/**
 * Get all locations
 */
export const getAllLocations = async (): Promise<LocationResponse[]> => {
  const locations = await locationModel.getAllLocations();
  return locations as LocationResponse[];
};

/**
 * Get location by ID
 */
export const getLocationById = async (id: string): Promise<LocationResponse | null> => {
  const location = await locationModel.getLocationById(id);
  if (!location) {
    return null;
  }
  return location as LocationResponse;
};

/**
 * Update location by ID
 */
export const updateLocation = async (id: string, updateData: UpdateLocationRequest): Promise<LocationResponse> => {
  const location = await locationModel.updateLocation(id, updateData);
  if (!location) {
    throw new Error('Location not found or update failed');
  }
  return location as LocationResponse;
};

/**
 * Delete location by ID
 */
export const deleteLocation = async (id: string): Promise<boolean> => {
  const result = await locationModel.deleteLocation(id);
  if (!result) {
    throw new Error('Location not found or deletion failed');
  }
  return result;
};