import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { uploadFile, downloadFile, deleteFile, getFilesByIds, getThumbnail, getPreview } from '../proxy/fileProxy';
import { sendErrorResponse } from '../utils/response';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

router.post('/', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const multerReq = req as MulterRequest;
    
    if (!multerReq.file) {
      return res.status(400).json({
        success: false,
        error_message: 'No file provided',
      });
    }

    const fileResponse = await uploadFile(
      token,
      multerReq.file,
      (req as any).correlationId
    );
    res.status(fileResponse.status).json(fileResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to upload file', null, [], [], status);
  }
});

router.post('/batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const fileIds = Array.isArray(req.body.file_ids) ? req.body.file_ids.map((id: any) => parseInt(id)) : [];
    const fileResponse = await getFilesByIds(token, fileIds, (req as any).correlationId);
    res.status(fileResponse.status).json(fileResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to fetch files by IDs', null, [], [], status);
  }
});


router.get('/:id/thumbnail', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const fileId = parseInt(req.params.id);
    const fileResponse = await getThumbnail(token, fileId, (req as any).correlationId);
    
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.status(fileResponse.status).send(fileResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to fetch thumbnail', null, [], [], status);
  }
});

router.get('/:id/preview', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const fileId = parseInt(req.params.id);
    const fileResponse = await getPreview(token, fileId, (req as any).correlationId);
    
    res.setHeader('Content-Type', fileResponse.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Disposition', fileResponse.headers['content-disposition'] || 'inline');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(fileResponse.status).send(fileResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to fetch preview', null, [], [], status);
  }
});

router.get('/:id/download', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const fileId = parseInt(req.params.id);
    const fileResponse = await downloadFile(token, fileId, (req as any).correlationId);
    
    res.setHeader('Content-Type', fileResponse.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Disposition', fileResponse.headers['content-disposition'] || 'attachment');
    res.status(fileResponse.status).send(fileResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to download file', null, [], [], status);
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = (req as any).token;
    const fileId = parseInt(req.params.id);
    const fileResponse = await deleteFile(token, fileId, (req as any).correlationId);
    res.status(fileResponse.status).json(fileResponse.data);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const errorData = error?.data;
    
    if (errorData && errorData.success === false) {
      return res.status(status).json(errorData);
    }
    
    sendErrorResponse(res, 'Failed to delete file', null, [], [], status);
  }
});

export { router as filesRouter };

