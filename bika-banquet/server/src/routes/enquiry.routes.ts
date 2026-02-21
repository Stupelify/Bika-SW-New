import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createEnquiry,
  createEnquirySchema,
  deleteEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  updateEnquirySchema,
} from '../controllers/enquiry.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requirePermission('add_enquiry', 'manage_enquiries'),
  validate(createEnquirySchema),
  createEnquiry
);
router.get('/', requirePermission('view_enquiry', 'manage_enquiries'), getEnquiries);
router.get('/:id', requirePermission('view_enquiry', 'manage_enquiries'), getEnquiryById);
router.put(
  '/:id',
  requirePermission('edit_enquiry', 'manage_enquiries'),
  validate(updateEnquirySchema),
  updateEnquiry
);
router.delete('/:id', requirePermission('delete_enquiry', 'manage_enquiries'), deleteEnquiry);

export default router;
