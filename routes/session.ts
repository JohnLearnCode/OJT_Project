import { Router } from 'express';
import * as sessionController from '../controller/session.js';
import { validateBody } from '../middleware/validation.js';
import { createSessionSchema, updateSessionSchema } from '../validator/session.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requiredAdmin.js';
import { requireTeacher } from '../middleware/requireTeacher.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: Session/Schedule management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Session:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         session_date:
 *           type: string
 *           format: date
 *           example: '2026-03-20'
 *         time:
 *           type: string
 *           enum: ['07:00-09:00', '09:00-11:00', '13:00-15:00', '15:00-17:00']
 *           example: '09:00-11:00'
 *         roomid:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         courseid:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         userid:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         location:
 *           type: object
 *           properties:
 *             room_name:
 *               type: string
 *               example: Room A101
 *             location:
 *               type: string
 *               example: Tầng 1, Tòa A
 *         course:
 *           type: object
 *           properties:
 *             courseName:
 *               type: string
 *               example: Web Development
 *             description:
 *               type: string
 *               example: Learn web development fundamentals
 *         user:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: Nguyễn Văn A
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /sessions:
 *   post:
 *     summary: Create a new session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session_date
 *               - time
 *               - roomid
 *               - courseid
 *               - userid
 *             properties:
 *               session_date:
 *                 type: string
 *                 format: date
 *                 example: '2026-03-20'
 *               time:
 *                 type: string
 *                 enum: ['07:00-09:00', '09:00-11:00', '13:00-15:00', '15:00-17:00']
 *                 example: '09:00-11:00'
 *                 description: Time slot must be one of the allowed values
 *               roomid:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *                 description: Reference to Location ID
 *               courseid:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *                 description: Reference to Course ID
 *               userid:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *                 description: Reference to Teacher/User ID
 *     responses:
 *       201:
 *         description: Session created successfully
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
 *                   $ref: '#/components/schemas/Session'
 *       400:
 *         description: Validation error, invalid time slot, or scheduling conflict
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/', requireAuth, requireAdmin, validateBody(createSessionSchema), sessionController.createSession);

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: Get all sessions (Teacher & Admin)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all sessions
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
 *                   items:
 *                     $ref: '#/components/schemas/Session'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Teacher or Admin access required
 */
router.get('/', requireAuth, requireTeacher, sessionController.getAllSessions);

/**
 * @swagger
 * /sessions/{id}:
 *   get:
 *     summary: Get session by ID (Teacher & Admin)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session details
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
 *                   $ref: '#/components/schemas/Session'
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Teacher or Admin access required
 */
router.get('/:id', requireAuth, requireTeacher, sessionController.getSessionById);

/**
 * @swagger
 * /sessions/{id}:
 *   put:
 *     summary: Update session by ID
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *                 enum: ['07:00-09:00', '09:00-11:00', '13:00-15:00', '15:00-17:00']
 *               roomid:
 *                 type: string
 *               courseid:
 *                 type: string
 *               userid:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session updated successfully
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
 *                   $ref: '#/components/schemas/Session'
 *       404:
 *         description: Session not found
 *       400:
 *         description: Validation error or scheduling conflict
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', requireAuth, requireAdmin, validateBody(updateSessionSchema), sessionController.updateSession);

/**
 * @swagger
 * /sessions/{id}:
 *   delete:
 *     summary: Delete session by ID
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', requireAuth, requireAdmin, sessionController.deleteSession);

export default router;