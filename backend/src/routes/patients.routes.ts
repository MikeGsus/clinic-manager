import { Router } from 'express';
import { getAll, getById, create, update, remove } from '../controllers/patients.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRoles, ROLE_GROUPS } from '../middleware/rbac.middleware.js';
import type { RequestHandler } from 'express';

const router = Router();

router.use(authenticate as RequestHandler);

router.get(
  '/',
  requireRoles(...ROLE_GROUPS.medical) as RequestHandler,
  getAll as RequestHandler
);
router.get(
  '/:id',
  requireRoles(...ROLE_GROUPS.medical) as RequestHandler,
  getById as RequestHandler
);
router.post(
  '/',
  requireRoles('admin', 'doctor', 'recepcionista') as RequestHandler,
  create as RequestHandler
);
router.put(
  '/:id',
  requireRoles(...ROLE_GROUPS.medical) as RequestHandler,
  update as RequestHandler
);
router.delete(
  '/:id',
  requireRoles('admin', 'doctor') as RequestHandler,
  remove as RequestHandler
);

export default router;
