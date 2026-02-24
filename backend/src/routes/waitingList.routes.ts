import { Router } from 'express';
import type { RequestHandler } from 'express';
import {
  listWaitingList,
  addToWaitingList,
  removeFromWaitingList,
} from '../controllers/waitingList.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate as RequestHandler);
router.use(requireRoles('admin', 'recepcionista') as RequestHandler);

router.get('/', listWaitingList as RequestHandler);
router.post('/', addToWaitingList as RequestHandler);
router.delete('/:id', removeFromWaitingList as RequestHandler);

export default router;
