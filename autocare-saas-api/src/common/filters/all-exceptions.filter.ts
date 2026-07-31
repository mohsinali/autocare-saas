import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp(); const response = ctx.getResponse<Response>(); const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = typeof exceptionResponse === 'object' && exceptionResponse && 'message' in exceptionResponse ? (exceptionResponse as { message: unknown }).message : status === 500 ? 'Internal server error' : exception instanceof Error ? exception.message : 'Request failed';
    response.status(status).json({ statusCode: status, message, timestamp: new Date().toISOString(), path: request.url });
  }
}
