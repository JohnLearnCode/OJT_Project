import { getCollection } from "../config/database";
import { CollectionName } from "../types/common/enums";
import { CreateLocationRequest, UpdateLocationRequest, LocationResponse, Location } from "../types/location/request";
import { ObjectId } from "mongodb";

/**
 * Create a new location
 */
export const createLocation = async (locationData: CreateLocationRequest): Promise<Location | null> => {
  try {
    const collection = getCollection<Location>(CollectionName.LOCATIONS);

    // Check if location already exists by room_name (optional, but we can enforce uniqueness)
    const existingLocation = await collection.findOne({ room_name: locationData.room_name });
    if (existingLocation) {
      return null; // Indicate that room_name already exists
    }

    const newLocation = {
      room_name: locationData.room_name,
      location: locationData.location,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newLocation as unknown as Location);

    if (result.insertedId) {
      return await collection.findOne({ _id: result.insertedId });
    }

    return null;
  } catch (error) {
    console.error('Error creating location:', error);
    return null;
  }
};

/**
 * Get all locations
 */
export const getAllLocations = async (): Promise<Location[]> => {
  const collection = getCollection<Location>(CollectionName.LOCATIONS);
  return await collection.find().toArray();
};

/**
 * Get location by ID
 */
export const getLocationById = async (id: string): Promise<Location | null> => {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const collection = getCollection<Location>(CollectionName.LOCATIONS);
  return await collection.findOne({ _id: new ObjectId(id) });
};

/**
 * Update location by ID
 */
export const updateLocation = async (id: string, updateData: UpdateLocationRequest): Promise<Location | null> => {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const collection = getCollection<Location>(CollectionName.LOCATIONS);

  // Check if location exists
  const existingLocation = await collection.findOne({ _id: new ObjectId(id) });
  if (!existingLocation) {
    return null;
  }

  // Prepare update object
  const updateObj: any = {
    updatedAt: new Date()
  };

  if (updateData.room_name !== undefined) {
    // Optionally check if another location has this room_name
    const roomExists = await collection.findOne({ 
      room_name: updateData.room_name, 
      _id: { $ne: new ObjectId(id) }
    });
    if (roomExists) {
      throw new Error('Room name already exists');
    }
    updateObj.room_name = updateData.room_name;
  }

  if (updateData.location !== undefined) {
    updateObj.location = updateData.location;
  }

  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateObj }
  );

  if (result.modifiedCount === 1) {
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  return null;
};

/**
 * Delete location by ID
 */
export const deleteLocation = async (id: string): Promise<boolean> => {
  if (!ObjectId.isValid(id)) {
    return false;
  }
  const collection = getCollection<Location>(CollectionName.LOCATIONS);
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
};