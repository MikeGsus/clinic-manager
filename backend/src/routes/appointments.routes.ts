import { Router } from 'express';
import type { RequestHandler } from 'express';
import {
  listAppointments,
  getAvailableSlots,
  getByQRToken,
  checkIn,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  rescheduleAppointment,
} from '../controllers/appointments.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// All appointment routes require authentication
router.use(authenticate as RequestHandler);

// Available slots — any staff can query
router.get('/available-slots', requireRoles('admin', 'doctor', 'enfermera', 'recepcionista') as RequestHandler, getAvailableSlots as RequestHandler);

// QR check-in
router.get('/checkin/:qrToken', getByQRToken as RequestHandler);
router.post('/checkin/:qrToken', requireRoles('admin', 'enfermera', 'recepcionista') as RequestHandler, checkIn as RequestHandler);

// List & create
router.get('/', requireRoles('admin', 'doctor', 'enfermera', 'recepcionista', 'paciente') as RequestHandler, listAppointments as RequestHandler);
router.post('/', requireRoles('admin', 'doctor', 'recepcionista') as RequestHandler, createAppointment as RequestHandler);

// Single appointment
router.get('/:id', requireRoles('admin', 'doctor', 'enfermera', 'recepcionista', 'paciente') as RequestHandler, getAppointment as RequestHandler);
router.put('/:id', requireRoles('admin', 'doctor', 'recepcionista') as RequestHandler, updateAppointment as RequestHandler);
router.post('/:id/cancel', requireRoles('admin', 'doctor', 'recepcionista', 'paciente') as RequestHandler, cancelAppointment as RequestHandler);
router.post('/:id/reschedule', requireRoles('admin', 'doctor', 'recepcionista') as RequestHandler, rescheduleAppointment as RequestHandler);

export default router;
