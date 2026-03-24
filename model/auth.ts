import { getCollection } from "../config/database";
import { RegisterUserRequest, User } from "../types/auth/request";
import { CollectionName } from "../types/common/enums";
import { hashPassword, comparePassword } from "../utils/password.js";
import { ObjectId } from "mongodb";

export const registerAuth = async (authData: RegisterUserRequest): Promise<User | null> => {
  try {
    const collection = getCollection<User>(CollectionName.USERS);

    // Check if user already exists
    const existingUser = await findUserByEmail(authData.email);
    if (existingUser) {
      return null;
    }

    // Hash password
    const hashedPassword = await hashPassword(authData.password);

    const newAuth = {
      password: hashedPassword,
      name: authData.name,
      email: authData.email,
      phoneNumber: authData.phoneNumber,
      role: authData.role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newAuth as User);

    if (result.insertedId) {
      return await collection.findOne({ _id: result.insertedId });
    }

    return null;
  } catch (error) {
    console.error('Lỗi register User ở Model:', error);
    return null;
  }
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const collection = getCollection<User>(CollectionName.USERS);
  return await collection.findOne({
    email: email
  })
}

export const findUserByPhoneNumber = async (phoneNumber: string): Promise<User | null> => {
  const collection = getCollection<User>(CollectionName.USERS);
  return await collection.findOne({
    phoneNumber: phoneNumber
  })
}