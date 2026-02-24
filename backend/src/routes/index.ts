import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import patientsRoutes from './patients.routes.js';
import appointmentsRoutes from './appointments.routes.js';
import doctorScheduleRoutes from './doctorSchedule.routes.js';
import waitingListRoutes from './waitingList.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/patients', patientsRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/doctor-schedule', doctorScheduleRoutes);
router.use('/waiting-list', waitingListRoutes);

export default router;
