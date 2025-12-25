import { Response } from 'express';
import { ResponseStatus } from '../../enums/http-status-codes';

export interface SuccessResponse<T = any> {
    success: true;
    message: string;
    data: T;
    extra: any[];
}

export interface ErrorResponse {
    success: false;
    data: any;
    error: string | null;
    error_message: string | null;
    errors: any;
    trace: any[];
}

export function sendSuccessResponse<T>(
  res: Response,
    data: T,
    message: string = '',
  statusCode: number = ResponseStatus.OK
): void {
    const response: SuccessResponse<T> = {
        success: true,
        message: message,
        data: data,
        extra: []
    };
  res.status(statusCode).json(response);
}

export function sendErrorResponse(
  res: Response,
    error: string | null = null,
    errors: any = null,
    data: any = [],
    trace: any[] = [],
  statusCode: number = ResponseStatus.INTERNAL_SERVER
): void {
    let firstError: string | null = error;
    
    if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
        const firstValue = Object.values(errors)[0];
        if (Array.isArray(firstValue) && firstValue.length > 0) {
            firstError = String(firstValue[0]);
        } else if (firstValue) {
            firstError = String(firstValue);
        }
    }

    const response: ErrorResponse = {
        success: false,
        data: data,
        error: error,
        error_message: firstError,
        errors: errors || [],
        trace: trace
    };
  res.status(statusCode).json(response);
}
