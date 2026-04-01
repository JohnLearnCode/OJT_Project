// controller/schedule.ts
import { Request, Response, NextFunction } from 'express';
import * as scheduleService from '../service/schedule.js';
import { StatusCodes } from 'http-status-codes';
import { ResponseHelper } from '../utils/response.js';

/**
 * @swagger
 * /api/schedule/import:
 *   post:
 *     summary: Import teaching schedule from Excel file
 *     description: Imports multiple teacher schedules from an Excel file. Rejects entire import if any conflicts found.
 *     tags:
 *       - Schedule
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file with columns (Teacher Name, Course Name, Room Name, Date, Start Time, End Time)
 *     responses:
 *       201:
 *         description: Successfully imported schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *       400:
 *         description: Import validation failed
 *       401:
 *         description: Unauthorized
 */
export const importSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return ResponseHelper.error(res, 'No file uploaded', StatusCodes.BAD_REQUEST.toString());
    }

      const result = await scheduleService.importScheduleFromExcel(
          req.file.buffer.buffer as ArrayBuffer
      );


      if (!result.success) {
      return ResponseHelper.error(res, result.message, StatusCodes.BAD_REQUEST.toString());
    }

    return ResponseHelper.success(
      res,
      result.message,
      result.sessions,
      StatusCodes.CREATED
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/schedule/export:
 *   post:
 *     summary: Export teaching schedule to PDF
 *     description: Exports schedule to PDF for one or multiple teachers
 *     tags:
 *       - Schedule
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teacherIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of teacher IDs. If empty, exports all schedules.
 *     responses:
 *       200:
 *         description: PDF file generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 */
export const exportSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teacherIds } = req.body;

    const pdfBuffer = await scheduleService.exportScheduleToPDF(teacherIds);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="schedule-${new Date().getTime()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};