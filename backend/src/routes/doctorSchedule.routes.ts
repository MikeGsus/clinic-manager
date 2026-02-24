import { Router } from 'express';
import type { RequestHandler } from 'express';
import {
  getSchedule,
  upsertDay,
  getExceptions,
  createException,
  deleteException,
} from '../controllers/doctorSchedule.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate as RequestHandler);

router.get('/', getSchedule as RequestHandler);
router.put('/day', upsertDay as RequestHandler);
router.get('/exceptions', getExceptions as RequestHandler);
router.post('/exceptions', createException as RequestHandler);
router.delete('/exceptions/:id', deleteException as RequestHandler);

export default router;
