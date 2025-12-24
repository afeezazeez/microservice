import { Response } from 'express';
import { ResponseStatus } from '../../enums/http-status-codes';

export class SuccessResponseDto<T = any> {
    success: boolean;
    message?: string;
    data?: T;

    constructor(message: string | null = null, data?: T) {
        this.success = true;
        if (message) {
            this.message = message;
        }
        this.data = data;
    }
}

export class ErrorResponseDto<T = any> {
    success: boolean;
    message?: string;
    errors?: T;

    constructor(message: string | null = null, errors?: T) {
        this.success = false;
        if (message) {
            this.message = message;
        }
        if (errors) {
            this.errors = errors;
        }
    }
}

export function sendSuccessResponse<T>(
  res: Response,
    data?: T,
    message: string | null = null,
  statusCode: number = ResponseStatus.OK
): void {
    const response = new SuccessResponseDto(message, data);
  res.status(statusCode).json(response);
}

export function sendErrorResponse<T>(
  res: Response,
    error?: T,
    message: string | null = null,
  statusCode: number = ResponseStatus.INTERNAL_SERVER
): void {
    const response = new ErrorResponseDto(message, error);
  res.status(statusCode).json(response);
}
