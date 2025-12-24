import { ResponseStatus } from '../enums/http-status-codes';

export class ValidationException extends Error {
    public statusCode: number;
    public errors: any[];

    constructor(errors: any, message: string = 'Validation failed', statusCode: number = ResponseStatus.UNPROCESSABLE_ENTITY) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
    }
}
