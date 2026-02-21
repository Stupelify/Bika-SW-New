import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { getDashboardSummary } from '../controllers/analytics.controller';

const router = Router();

router.use(authenticate);

router.get('/dashboard', requirePermission('view_dashboard', 'view_reports'), getDashboardSummary);

export default router;
