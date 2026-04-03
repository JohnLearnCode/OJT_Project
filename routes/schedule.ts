import { Router } from 'express';
  import * as scheduleController from '../controller/schedule.js';
  import { requireAdmin } from '../middleware/requiredAdmin.js';
  import multer from 'multer';

  const router = Router();
  const upload = multer({ storage: multer.memoryStorage() });

  router.post(
    '/import',
    requireAdmin,
    upload.single('file'),
    scheduleController.importSchedule
  );

  router.post(
    '/export',
    requireAdmin,
    scheduleController.exportSchedule
  );

  export default router;