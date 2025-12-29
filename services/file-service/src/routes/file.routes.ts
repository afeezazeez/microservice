import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/permission.middleware';

const router = Router();
const fileController = new FileController();

router.use(authMiddleware);

router.post('/', requirePermission('file:upload'), fileController.uploadFile);
router.post('/batch', requirePermission('file:view'), fileController.getFilesByIds);
router.get('/:id/thumbnail', requirePermission('file:view'), fileController.getThumbnail);
router.get('/:id/preview', requirePermission('file:view'), fileController.getPreview);
router.get('/:id/download', requirePermission('file:view'), fileController.downloadFile);
router.delete('/:id', requirePermission('file:delete'), fileController.deleteFile);

export default router;

