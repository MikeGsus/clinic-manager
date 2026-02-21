import { Router } from 'express';
import {
  login,
  logout,
  me,
  refresh,
  changePasswordHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  getAuditLogs,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';
import type { AuthenticatedRequest } from '../types/index.js';
import type { RequestHandler } from 'express';

const router = Router();

// Public routes
router.post('/login', login as RequestHandler);
router.post('/refresh', refresh as RequestHandler);
router.post('/forgot-password', forgotPasswordHandler as RequestHandler);
router.post('/reset-password', resetPasswordHandler as RequestHandler);

// Authenticated routes
router.post('/logout', authenticate as RequestHandler, logout as RequestHandler);
router.get('/me', authenticate as RequestHandler, (req, res) =>
  me(req as AuthenticatedRequest, res)
);
router.post(
  '/change-password',
  authenticate as RequestHandler,
  changePasswordHandler as RequestHandler
);

// Admin only
router.get(
  '/audit-logs',
  authenticate as RequestHandler,
  requireRoles('admin') as RequestHandler,
  getAuditLogs as RequestHandler
);

export default router;
