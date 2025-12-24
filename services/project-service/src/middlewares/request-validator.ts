import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { ValidationException } from '../exceptions/validation.exception';

function extractErrors(errors: ValidationError[], parentKey = ''): { [key: string]: string[] } {
    let errorMessages: { [key: string]: string[] } = {};

    errors.forEach((error) => {
        const key = parentKey ? `${parentKey}.${error.property}` : error.property;

        if (error.constraints) {
            errorMessages[key] = Object.values(error.constraints);
        }

        if (error.children && error.children.length > 0) {
            const childErrors = extractErrors(error.children, key);
            errorMessages = { ...errorMessages, ...childErrors };
        }
    });

    return errorMessages;
}

export function validateBody<T>(dtoClass: new () => T) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const dtoObject = plainToInstance(dtoClass, req.body) as object;

        const errors: ValidationError[] = await validate(dtoObject);

        if (errors.length > 0) {
            const errorMessages = extractErrors(errors);

            const firstField = Object.keys(errorMessages)[0];
            const firstErrorMessage = errorMessages[firstField]?.[0] || 'Invalid request format.';

            next(new ValidationException(errorMessages, firstErrorMessage));
            return;
        }

        req.body = dtoObject;
        next();
    };
}

