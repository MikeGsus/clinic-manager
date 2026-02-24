import { Router } from 'express';
import { getAll, getById, create, update, remove, getMe, updateMe, getDoctors } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';
import type { RequestHandler } from 'express';

const router = Router();

router.use(authenticate as RequestHandler);

// Own profile (any authenticated user)
router.get('/me', getMe as RequestHandler);
router.put('/me', updateMe as RequestHandler);

// Doctors list — accessible to all staff (used in appointment booking)
router.get('/doctors', requireRoles('admin', 'doctor', 'enfermera', 'recepcionista') as RequestHandler, getDoctors as RequestHandler);

// Admin-only CRUD
router.get('/', requireRoles('admin') as RequestHandler, getAll as RequestHandler);
router.get('/:id', requireRoles('admin') as RequestHandler, getById as RequestHandler);
router.post('/', requireRoles('admin') as RequestHandler, create as RequestHandler);
router.put('/:id', requireRoles('admin') as RequestHandler, update as RequestHandler);
router.delete('/:id', requireRoles('admin') as RequestHandler, remove as RequestHandler);

export default router;
