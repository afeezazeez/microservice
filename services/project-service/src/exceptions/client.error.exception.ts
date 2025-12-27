import { ResponseStatus } from '../enums/http-status-codes';

export class ClientErrorException extends Error {
  public statusCode: number;

  constructor(message: string = 'Client Error', statusCode: number = ResponseStatus.BAD_REQUEST) {
    super(message);
    this.statusCode = statusCode;
  }
}



