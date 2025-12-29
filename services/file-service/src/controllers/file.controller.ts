import { Response, NextFunction } from 'express';
import multer from 'multer';
import { FileService } from '../services/file.service';
import thumbnailService from '../services/thumbnail.service';
import { sendSuccessResponse } from '../utils/http/response-handlers';
import { ResponseStatus } from '../enums/http-status-codes';
import { AuthenticatedRequest } from '../types/auth';
import FileResponseDto from '../dtos/file/file-response.dto';

const upload = multer({ storage: multer.memoryStorage() });

export class FileController {
  private readonly fileService: FileService;

  constructor() {
    this.fileService = new FileService();
  }

  uploadFile = [
    upload.single('file'),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.file) {
          return res.status(ResponseStatus.BAD_REQUEST).json({
            success: false,
            error_message: 'No file provided',
          });
        }

        const user = req.user!;
        const file = await this.fileService.uploadFile(req.file, user.id);

        return sendSuccessResponse(
          res,
          { id: file.id },
          'File uploaded successfully',
          ResponseStatus.CREATED
        );
      } catch (error) {
        next(error);
      }
    },
  ];


  downloadFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const fileId = parseInt(req.params.id);
      const { file, buffer } = await this.fileService.downloadFile(fileId);

      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
      res.setHeader('Content-Length', buffer.length);

      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  deleteFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const fileId = parseInt(req.params.id);
      const user = req.user!;

      await this.fileService.deleteFile(fileId, user.id);

      return sendSuccessResponse(res, null, 'File deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getFilesByIds = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const fileIds = Array.isArray(req.body.file_ids) 
        ? req.body.file_ids.map((id: any) => parseInt(id))
        : [];

      if (fileIds.length === 0) {
        return sendSuccessResponse(res, [], 'Files retrieved successfully');
      }

      const files = await this.fileService.getFilesByIds(fileIds);

      return sendSuccessResponse(res, FileResponseDto.makeMany(files), 'Files retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getThumbnail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await this.fileService.getFile(fileId);

      if (!file.thumbnail_path) {
        return res.status(ResponseStatus.NOT_FOUND).json({
          success: false,
          error_message: 'Thumbnail not available for this file',
        });
      }

      const thumbnailBuffer = await thumbnailService.getThumbnail(file.thumbnail_path);

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.send(thumbnailBuffer);
    } catch (error) {
      next(error);
    }
  };

  getPreview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const fileId = parseInt(req.params.id);
      const { file, buffer } = await this.fileService.downloadFile(fileId);

      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600');

      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  };
}

