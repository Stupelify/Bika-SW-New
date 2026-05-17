import { Router } from 'express';
import authRoutes from './auth.routes';
import customerRoutes from './customer.routes';
import bookingRoutes from './booking.routes';
import enquiryRoutes from './enquiry.routes';
import banquetRoutes from './banquet.routes';
import hallRoutes from './hall.routes';
import itemRoutes from './item.routes';
import itemTypeRoutes from './itemType.routes';
import templateMenuRoutes from './templateMenu.routes';
import ingredientRoutes from './ingredient.routes';
import vendorRoutes from './vendor.routes';
import userRoutes from './user.routes';
import roleRoutes from './role.routes';
import permissionRoutes from './permission.routes';
import rbacRoutes from './rbac.routes';
import analyticsRoutes from './analytics.routes';
import calendarRoutes from './calendar.routes';
import searchRoutes from './search.routes';
import auditLogRoutes from './auditLog.routes';
import { authenticate } from '../middleware/auth.middleware';
import { addSseClient, removeSseClient } from '../sse';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Bika Banquet API',
    docs: '/api/health',
  });
});

router.get('/events', authenticate, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  addSseClient(res);
  res.write(': connected\n\n');

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeSseClient(res);
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/bookings', bookingRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/banquets', banquetRoutes);
router.use('/halls', hallRoutes);
router.use('/items', itemRoutes);
router.use('/item-types', itemTypeRoutes);
router.use('/template-menus', templateMenuRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/vendors', vendorRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/rbac', rbacRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/calendar', calendarRoutes);
router.use('/search', searchRoutes);
router.use('/audit-logs', auditLogRoutes);

// Legacy-style aliases for easier migration from older project paths
router.use('/customer', customerRoutes);
router.use('/booking', bookingRoutes);
router.use('/enquiry', enquiryRoutes);
router.use('/banquet', banquetRoutes);
router.use('/hall', hallRoutes);
router.use('/item', itemRoutes);
router.use('/templatemenu', templateMenuRoutes);
router.use('/ingredient', ingredientRoutes);
router.use('/vendor', vendorRoutes);
router.use('/role', roleRoutes);
router.use('/permission', permissionRoutes);
router.use('/user', userRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
