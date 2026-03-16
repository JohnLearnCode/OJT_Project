import { Router } from 'express';
import * as locationController from '../controller/location.js';
import { validateBody } from '../middleware/validation.js';
import { createLocationSchema, updateLocationSchema } from '../validator/location.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requiredAdmin.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Location/Room management (Admin only)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         room_name:
 *           type: string
 *           example: Room A101
 *         location:
 *           type: string
 *           example: Building A, Floor 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

/**
 * @swagger
 * /locations:
 *   post:
 *     summary: Create a new location/room
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - room_name
 *               - location
 *             properties:
 *               room_name:
 *                 type: string
 *                 example: Room A101
 *               location:
 *                 type: string
 *                 example: Building A, Floor 1
 *     responses:
 *       201:
 *         description: Location created successfully
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
 *                   $ref: '#/components/schemas/Location'
 *       400:
 *         description: Room name already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/', validateBody(createLocationSchema), locationController.createLocation);

/**
 * @swagger
 * /locations:
 *   get:
 *     summary: Get all locations/rooms
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all locations
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
 *                     $ref: '#/components/schemas/Location'
 *       401:
 *         description: Unauthorized
 */
router.get('/', locationController.getAllLocations);

/**
 * @swagger
 * /locations/{id}:
 *   get:
 *     summary: Get location by ID
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location details
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
 *                   $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', locationController.getLocationById);

/**
 * @swagger
 * /locations/{id}:
 *   put:
 *     summary: Update location by ID
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               room_name:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Location updated successfully
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
 *                   $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', validateBody(updateLocationSchema), locationController.updateLocation);

/**
 * @swagger
 * /locations/{id}:
 *   delete:
 *     summary: Delete location by ID
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location deleted successfully
 *       404:
 *         description: Location not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', locationController.deleteLocation);

export default router;