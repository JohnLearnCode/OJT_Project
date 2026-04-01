// routes/schedule.ts
import { Router } from 'express';
import * as scheduleController from '../controller/schedule.js';
import { authMiddleware } from '../middleware/auth.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/import',
  authMiddleware,
  upload.single('file'),
  scheduleController.importSchedule
);

router.post(
  '/export',
  authMiddleware,
  scheduleController.exportSchedule
);

export default router;