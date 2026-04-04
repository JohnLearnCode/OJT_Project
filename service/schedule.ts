// service/schedule.ts
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import * as scheduleModel from '../model/schedule.js';
import * as userModel from '../model/user.js';
import * as courseModel from '../model/course.js';
import * as locationModel from '../model/location.js';
import * as sessionModel from '../model/session.js';
import { Session } from '../types/session/request';
import { ObjectId } from 'mongodb';

const VALID_TIME_SLOTS = ['07:00-09:00', '09:00-11:00', '13:00-15:00', '15:00-17:00'];

const TIME_SLOT_MAP: Record<string, string> = {
  '07:00-09:00': '07:00-09:00',
  '7:00-9:00': '07:00-09:00',
  '09:00-11:00': '09:00-11:00',
  '9:00-11:00': '09:00-11:00',
  '13:00-15:00': '13:00-15:00',
  '1:00-3:00': '13:00-15:00',
  '15:00-17:00': '15:00-17:00',
  '3:00-5:00': '15:00-17:00',
};

const normalizeTime = (time: string): string => {
  const trimmed = time.trim();
  const parts = trimmed.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] ? parseInt(parts[1], 10) : 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const extractTimeFromCell = (cell: any): string => {
  if (!cell) return '';

  if (cell instanceof Date) {
    const hours = cell.getUTCHours();
    const minutes = cell.getUTCMinutes();
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  if (typeof cell === 'object' && cell.text) {
    const str = cell.text.toString().trim();
    if (/^\d{1,2}:\d{2}/.test(str)) return str;
  }

  if (typeof cell === 'number') {
    const totalMinutes = Math.round(cell * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  return cell.toString().trim();
};

const extractTimeSlotFromCell = (cell: any): string => {
  if (!cell) return '';

  if (cell instanceof Date) {
    const hours = cell.getUTCHours();
    const minutes = cell.getUTCMinutes();
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  if (typeof cell === 'number') {
    const totalMinutes = Math.round(cell * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const str = cell.toString().trim();

  const match = str.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
  if (match) {
    const start = normalizeTime(match[1]);
    const end = normalizeTime(match[2]);
    return `${start}-${end}`;
  }

  return str;
};

const mapToValidTimeSlot = (timeSlot: string): string | null => {
  const normalized = timeSlot.trim();
  if (TIME_SLOT_MAP[normalized]) {
    return TIME_SLOT_MAP[normalized];
  }
  return null;
};

const extractDateFromCell = (cell: any): string => {
  if (!cell) return '';

  if (cell instanceof Date) {
    const day = cell.getDate();
    const month = cell.getMonth() + 1;
    const year = cell.getFullYear();
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  if (typeof cell === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + cell * 24 * 60 * 60 * 1000);
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  return cell.toString().trim();
};

interface ExcelRow {
teacherName: string;
courseName: string;
roomName: string;
date: string;
timeSlot: string;
}

export const importScheduleFromExcel = async (buffer: ArrayBuffer): Promise<{ success: boolean; message: string; sessions?: Session[] }> => {
try {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    return { success: false, message: 'No worksheet found in Excel file' };
  }

  const rows: ExcelRow[] = [];
  const errors: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const col5 = row.getCell(5).value;
    const col6 = row.getCell(6).value;

    let timeSlot: string;

    if (col6) {
      const startTime = extractTimeFromCell(col5);
      const endTime = extractTimeFromCell(col6);
      const normalizedStart = normalizeTime(startTime);
      const normalizedEnd = normalizeTime(endTime);
      timeSlot = `${normalizedStart}-${normalizedEnd}`;
    } else {
      console.log('DEBUG col5:', col5, 'type:', typeof col5, 'isDate:', col5 instanceof Date);
      timeSlot = extractTimeSlotFromCell(col5);
      console.log('DEBUG timeSlot:', timeSlot);
    }

    const excelRow: ExcelRow = {
      teacherName: row.getCell(1).value?.toString() || '',
      courseName: row.getCell(2).value?.toString() || '',
      roomName: row.getCell(3).value?.toString() || '',
      date: extractDateFromCell(row.getCell(4).value),
      timeSlot: timeSlot
    };

    if (excelRow.teacherName && excelRow.courseName && excelRow.roomName && excelRow.date && excelRow.timeSlot) {
      rows.push(excelRow);
    } else {
      errors.push(`Row ${rowNumber}: Missing required fields (teacher="${excelRow.teacherName}", course="${excelRow.courseName}", room="${excelRow.roomName}", date="${excelRow.date}", timeSlot="${excelRow.timeSlot}")`);
    }
  });

  if (errors.length > 0) {
    return { success: false, message: errors.join('; ') };
  }

  const sessionsToCreate: Omit<Session, '_id'>[] = [];
  const validationErrors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const excelRow = rows[i];

    const teacher = await userModel.findUserByName(excelRow.teacherName);
    if (!teacher) {
      validationErrors.push(`Row ${i + 2}: Teacher "${excelRow.teacherName}" not found`);
      continue;
    }

    const course = await courseModel.getCourseByName(excelRow.courseName);
    if (!course) {
      validationErrors.push(`Row ${i + 2}: Course "${excelRow.courseName}" not found`);
      continue;
    }

    const location = await locationModel.getLocationByName(excelRow.roomName);
    if (!location) {
      validationErrors.push(`Row ${i + 2}: Room "${excelRow.roomName}" not found`);
      continue;
    }

    const dateStr = excelRow.date;
    let sessionDate: Date;
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      sessionDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      sessionDate = new Date(dateStr);
      sessionDate = new Date(Date.UTC(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate()));
    }
    if (isNaN(sessionDate.getTime())) {
      validationErrors.push(`Row ${i + 2}: Invalid date format`);
      continue;
    }

    const timeSlot = mapToValidTimeSlot(excelRow.timeSlot);
    if (!timeSlot) {
      validationErrors.push(`Row ${i + 2}: Invalid time slot "${excelRow.timeSlot}". Valid slots: ${VALID_TIME_SLOTS.join(', ')}`);
      continue;
    }

    const [startStr, endStr] = timeSlot.split('-');
    const [startHour, startMin] = startStr.split(':').map(Number);
    const [endHour, endMin] = endStr.split(':').map(Number);

    const startDateTime = new Date(Date.UTC(
      sessionDate.getUTCFullYear(),
      sessionDate.getUTCMonth(),
      sessionDate.getUTCDate(),
      startHour, startMin, 0
    ));

    const endDateTime = new Date(Date.UTC(
      sessionDate.getUTCFullYear(),
      sessionDate.getUTCMonth(),
      sessionDate.getUTCDate(),
      endHour, endMin, 0
    ));

    // Check 1: Teacher conflict
    const teacherConflict = await sessionModel.checkConflicts(teacher._id, location._id, startDateTime, endDateTime);
    if (teacherConflict.hasConflict) {
      validationErrors.push(`Row ${i + 2}: ${teacherConflict.message}`);
      continue;
    }

    // Check 2: Course daily limit - max 2 sessions per course per day
    const courseDailyLimit = await sessionModel.checkCourseDailyLimit(course._id, sessionDate);
    if (!courseDailyLimit.isValid) {
      validationErrors.push(`Row ${i + 2}: Course "${excelRow.courseName}" has reached the maximum limit of 2 sessions per day (${courseDailyLimit.count} sessions already scheduled)`);
      continue;
    }

    // Check 3: Course + Location conflict
    const courseLocationConflict = await sessionModel.checkCourseLocationConflict(course._id, location._id, sessionDate, timeSlot);
    if (courseLocationConflict) {
      validationErrors.push(`Row ${i + 2}: Course "${excelRow.courseName}" already has a session in room "${excelRow.roomName}" at ${timeSlot} on ${excelRow.date}`);
      continue;
    }

    sessionsToCreate.push({
      userid: teacher._id,
      courseid: course._id,
      roomid: location._id,
      session_date: sessionDate,
      time: timeSlot,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Omit<Session, '_id'>);
  }

  if (validationErrors.length > 0) {
    return { success: false, message: `Validation failed: ${validationErrors.join('; ')}` };
  }

  if (sessionsToCreate.length === 0) {
    return { success: false, message: 'No valid sessions to create' };
  }

  const createdSessions = await scheduleModel.createSessionBatch(sessionsToCreate);

  return {
    success: true,
    message: `Successfully imported ${createdSessions.length} sessions`,
    sessions: createdSessions
  };

} catch (error) {
  console.error('Error importing schedule:', error);
  return { success: false, message: 'Error processing Excel file' };
}
};

export const exportScheduleToPDF = async (teacherIds?: string[]): Promise<Buffer> => {
  const doc = new PDFDocument();
  const buffers: Buffer[] = [];

  doc.on('data', (chunk) => buffers.push(chunk));

  try {
    const sessions = (!teacherIds || teacherIds.length === 0)
      ? await scheduleModel.getSchedulesByTeachers([])
      : await scheduleModel.getSchedulesByTeachers(teacherIds);

    if (sessions.length === 0) {
      doc.fontSize(12).text('No schedules found', 100, 100);
    } else {
      const sessionsByTeacher = new Map();

      for (const session of sessions) {
        const teacherId = session.userid.toString();
        if (!sessionsByTeacher.has(teacherId)) {
          sessionsByTeacher.set(teacherId, []);
        }
        sessionsByTeacher.get(teacherId).push(session);
      }

      let isFirstPage = true;

      for (const [teacherId, teacherSessions] of sessionsByTeacher.entries()) {
        if (!isFirstPage) {
          doc.addPage();
        }
        isFirstPage = false;

        const teacher = await userModel.getUserById(teacherId);

        doc.fontSize(16).font('Helvetica-Bold').text(`Schedule for ${teacher?.name || 'Unknown'}`, 100, 50);
        doc.fontSize(10).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString()}`, 100, 80);
        doc.moveTo(100, 95).lineTo(500, 95).stroke();

        const tableTop = 110;
        const col1 = 100, col2 = 180, col3 = 260, col4 = 340, col5 = 420;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Course', col1, tableTop);
        doc.text('Room', col2, tableTop);
        doc.text('Date', col3, tableTop);
        doc.text('Start Time', col4, tableTop);
        doc.text('End Time', col5, tableTop);

        doc.moveTo(100, tableTop + 15).lineTo(500, tableTop + 15).stroke();

        let rowTop = tableTop + 20;
        doc.font('Helvetica').fontSize(9);

        for (const session of teacherSessions) {
          const course = await courseModel.getCourseById(session.courseid.toString());
          const location = await locationModel.getLocationById(session.roomid.toString());

          const [startStr, endStr] = (session.time || '').split('-');

          doc.text(course?.courseName || 'N/A', col1, rowTop);
          doc.text(location?.room_name || 'N/A', col2, rowTop);
          doc.text(new Date(session.session_date).toLocaleDateString(), col3, rowTop);
          doc.text(startStr || 'N/A', col4, rowTop);
          doc.text(endStr || 'N/A', col5, rowTop);

          rowTop += 20;

          if (rowTop > 750) {
            doc.addPage();
            rowTop = 50;
          }
        }
      }
    }

    doc.end();

    return await new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });

  } catch (error) {
    console.error('Error exporting schedule:', error);
    throw error;
  }
};
