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

interface ExcelRow {
  teacherName: string;
  courseName: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
}

export const importScheduleFromExcel = async (buffer: Buffer): Promise<{ success: boolean; message: string; sessions?: Session[] }> => {
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
        date: row.getCell(4).value?.toString() || '',
        startTime: row.getCell(5).value?.toString() || '',
        endTime: row.getCell(6).value?.toString() || ''
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

      // Parse date and times
      const sessionDate = new Date(excelRow.date);
      if (isNaN(sessionDate.getTime())) {
        validationErrors.push(`Row ${i + 2}: Invalid date format`);
        continue;
      }

      const [startHour, startMin] = excelRow.startTime.split(':').map(Number);
      const [endHour, endMin] = excelRow.endTime.split(':').map(Number);

      const startDateTime = new Date(sessionDate);
      startDateTime.setHours(startHour, startMin, 0);

      const endDateTime = new Date(sessionDate);
      endDateTime.setHours(endHour, endMin, 0);

      // Check for conflicts using session model validation
      const conflictCheck = await sessionModel.checkConflicts(teacher._id, location._id, startDateTime, endDateTime);
      if (conflictCheck.hasConflict) {
        validationErrors.push(`Row ${i + 2}: ${conflictCheck.message}`);
        continue;
      }

      sessionsToCreate.push({
        teacher_id: teacher._id,
        course_id: course._id,
        location_id: location._id,
        start_time: startDateTime,
        end_time: endDateTime,
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
    // Get sessions
    const sessions = teacherIds && teacherIds.length > 0
      ? await scheduleModel.getSchedulesByTeachers(teacherIds)
      : await scheduleModel.getSchedulesByTeachers([]);

    if (sessions.length === 0) {
      doc.fontSize(12).text('No schedules found', 100, 100);
    } else {
      // Group sessions by teacher
      const sessionsByTeacher = new Map();

      for (const session of sessions) {
        if (!sessionsByTeacher.has(session.teacher_id.toString())) {
          sessionsByTeacher.set(session.teacher_id.toString(), []);
        }
        sessionsByTeacher.get(session.teacher_id.toString()).push(session);
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
          const course = await courseModel.getCourseById(session.course_id.toString());
          const location = await locationModel.getLocationById(session.location_id.toString());

          doc.text(course?.courseName || 'N/A', col1, rowTop);
          doc.text(location?.room_name || 'N/A', col2, rowTop);
          doc.text(new Date(session.start_time).toLocaleDateString(), col3, rowTop);
          doc.text(new Date(session.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), col4, rowTop);
          doc.text(new Date(session.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), col5, rowTop);

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