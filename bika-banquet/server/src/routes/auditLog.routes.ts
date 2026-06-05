import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLog.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Require the dedicated audit-log permission (or the manage_users umbrella).
router.get('/', requirePermission('view_audit_logs', 'manage_users'), getAuditLogs);

export default router;
