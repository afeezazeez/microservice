import { ResponseStatus } from '../enums/http-status-codes';

export class AuthenticationException extends Error {
  public statusCode: number;

  constructor(message: string = 'Unauthorized', statusCode: number = ResponseStatus.UNAUTHORIZED) {
    super(message);
    this.statusCode = statusCode;
  }
}


