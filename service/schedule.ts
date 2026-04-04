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

  const str = cell.toString().trim();
  if (str.includes('GMT') || str.includes('1899')) {
    try {
      const date = new Date(str);
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch {
      return str;
    }
  }

  if (/^\d{1,2}:\d{2}/.test(str)) return str;

  return str;
};

const extractDateFromCell = (cell: any): string => {
  if (!cell) return '';
  if (cell instanceof Date) {
    const day = cell.getUTCDate();
    const month = cell.getUTCMonth() + 1;
    const year = cell.getUTCFullYear();
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }
  return cell.toString().trim();
};

const normalizeTime = (time: string): string => {
  const trimmed = time.trim();
  const parts = trimmed.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] ? parseInt(parts[1], 10) : 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

interface ExcelRow {
teacherName: string;
courseName: string;
roomName: string;
date: string;
startTime: string;
endTime: string;
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

  // Parse Excel rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const excelRow: ExcelRow = {
      teacherName: row.getCell(1).value?.toString() || '',
      courseName: row.getCell(2).value?.toString() || '',
      roomName: row.getCell(3).value?.toString() || '',
      date: extractDateFromCell(row.getCell(4).value),
      startTime: extractTimeFromCell(row.getCell(5).value),
      endTime: extractTimeFromCell(row.getCell(6).value)
    };

    if (excelRow.teacherName && excelRow.courseName && excelRow.roomName && excelRow.date && excelRow.startTime && excelRow.endTime) {
      rows.push(excelRow);
    } else {
      errors.push(`Row ${rowNumber}: Missing required fields`);
    }
  });

  if (errors.length > 0) {
    return { success: false, message: errors.join('; ') };
  }

  // Validate and prepare sessions
  const sessionsToCreate: Omit<Session, '_id'>[] = [];
  const validationErrors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const excelRow = rows[i];

    // Find teacher
    const teacher = await userModel.findUserByName(excelRow.teacherName);
    if (!teacher) {
      validationErrors.push(`Row ${i + 2}: Teacher "${excelRow.teacherName}" not found`);
      continue;
    }

    // Find course
    const course = await courseModel.getCourseByName(excelRow.courseName);
    if (!course) {
      validationErrors.push(`Row ${i + 2}: Course "${excelRow.courseName}" not found`);
      continue;
    }

    // Find location
    const location = await locationModel.getLocationByName(excelRow.roomName);
    if (!location) {
      validationErrors.push(`Row ${i + 2}: Room "${excelRow.roomName}" not found`);
      continue;
    }

    // Parse date
    let sessionDate: Date;
    const dateStr = excelRow.date;
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      sessionDate = new Date(year, month - 1, day);
    } else {
      sessionDate = new Date(dateStr);
    }
    if (isNaN(sessionDate.getTime())) {
      validationErrors.push(`Row ${i + 2}: Invalid date format`);
      continue;
    }

    // Normalize start/end times and combine into time slot
    const normalizedStart = normalizeTime(excelRow.startTime);
    const normalizedEnd = normalizeTime(excelRow.endTime);
    const timeSlot = `${normalizedStart}-${normalizedEnd}`;

    if (!VALID_TIME_SLOTS.includes(timeSlot)) {
      validationErrors.push(`Row ${i + 2}: Invalid time slot "${excelRow.startTime}-${excelRow.endTime}". Valid slots: ${VALID_TIME_SLOTS.join(', ')}`);
      continue;
    }

    // Parse time slot for conflict check
    const [startStr, endStr] = timeSlot.split('-');
    const [startHour, startMin] = startStr.split(':').map(Number);
    const [endHour, endMin] = endStr.split(':').map(Number);

    const startDateTime = new Date(sessionDate);
    startDateTime.setHours(startHour, startMin, 0);

    const endDateTime = new Date(sessionDate);
    endDateTime.setHours(endHour, endMin, 0);

    // Check for conflicts
    const conflictCheck = await sessionModel.checkConflicts(teacher._id, location._id, startDateTime, endDateTime);
    if (conflictCheck.hasConflict) {
      validationErrors.push(`Row ${i + 2}: ${conflictCheck.message}`);
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

  // Create all sessions
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
    // Get sessions - if empty array or undefined, fetch all
    const sessions = (!teacherIds || teacherIds.length === 0)
      ? await scheduleModel.getSchedulesByTeachers([])
      : await scheduleModel.getSchedulesByTeachers(teacherIds);

    if (sessions.length === 0) {
      doc.fontSize(12).text('No schedules found', 100, 100);
    } else {
      // Group sessions by teacher
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

        // Header
        doc.fontSize(16).font('Helvetica-Bold').text(`Schedule for ${teacher?.name || 'Unknown'}`, 100, 50);
        doc.fontSize(10).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString()}`, 100, 80);
        doc.moveTo(100, 95).lineTo(500, 95).stroke();

        // Table header
        const tableTop = 110;
        const col1 = 100, col2 = 180, col3 = 260, col4 = 340, col5 = 420;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Course', col1, tableTop);
        doc.text('Room', col2, tableTop);
        doc.text('Date', col3, tableTop);
        doc.text('Start Time', col4, tableTop);
        doc.text('End Time', col5, tableTop);

        doc.moveTo(100, tableTop + 15).lineTo(500, tableTop + 15).stroke();

        // Table rows
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