import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLog.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Require either 'view_dashboard' or 'manage_users'
router.get('/', requirePermission('view_dashboard', 'manage_users'), getAuditLogs);

export default router;
