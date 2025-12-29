import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/permission.middleware';

const router = Router();
const fileController = new FileController();

router.use(authMiddleware);

/**
 * @swagger
 * /api/files:
 *   post:
 *     summary: Upload a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', requirePermission('file:upload'), fileController.uploadFile);

/**
 * @swagger
 * /api/files/batch:
 *   post:
 *     summary: Get files by IDs
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               file_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/batch', requirePermission('file:view'), fileController.getFilesByIds);

/**
 * @swagger
 * /api/files/{id}/thumbnail:
 *   get:
 *     summary: Get file thumbnail
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: Thumbnail retrieved successfully
 *       404:
 *         description: Thumbnail not available
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/thumbnail', requirePermission('file:view'), fileController.getThumbnail);

/**
 * @swagger
 * /api/files/{id}/preview:
 *   get:
 *     summary: Get file preview
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: File preview retrieved successfully
 *       404:
 *         description: File not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/preview', requirePermission('file:view'), fileController.getPreview);

/**
 * @swagger
 * /api/files/{id}/download:
 *   get:
 *     summary: Download a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       404:
 *         description: File not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/download', requirePermission('file:view'), fileController.downloadFile);

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', requirePermission('file:delete'), fileController.deleteFile);

export default router;

