// model/schedule.ts
import { getCollection } from "../config/database";
import { CollectionName } from "../types/common/enums";
import { Session } from "../types/session/request";
import { ObjectId } from "mongodb";

export const createSessionBatch = async (sessions: Omit<Session, '_id'>[]): Promise<Session[]> => {
  const collection = getCollection<Session>(CollectionName.SESSIONS);
  const result = await collection.insertMany(sessions as unknown as Session[]);

  const createdSessions = await collection.find({
    _id: { $in: Object.values(result.insertedIds) }
  }).toArray();

  return createdSessions;
};

export const getSchedulesByTeacher = async (teacherId: string): Promise<Session[]> => {
  if (!ObjectId.isValid(teacherId)) {
    return [];
  }
  const collection = getCollection<Session>(CollectionName.SESSIONS);
  return await collection.find({ teacher_id: new ObjectId(teacherId) }).toArray();
};

export const getSchedulesByTeachers = async (teacherIds: string[]): Promise<Session[]> => {
  const validIds = teacherIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
  if (validIds.length === 0) return [];

  const collection = getCollection<Session>(CollectionName.SESSIONS);
  return await collection.find({ teacher_id: { $in: validIds } }).toArray();
};