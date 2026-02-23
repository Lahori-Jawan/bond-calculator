import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import { Response } from "express";

interface ErrorBody {
  message: string | string[];
  statusCode: number;
  errors?: string[];
}

@Catch()
export class SafeHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const details = exception.getResponse() as
        | string
        | { message?: string | string[]; errors?: string[] }
        | undefined;

      const message =
        typeof details === "string"
          ? details
          : details?.message ?? exception.message ?? "Request failed";

      const body: ErrorBody = {
        message: statusCode >= 500 ? "Internal server error." : message,
        statusCode
      };

      if (statusCode === HttpStatus.BAD_REQUEST && details && typeof details !== "string") {
        body.errors = details.errors;
      }

      response.status(statusCode).json(body);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error."
    });
  }
}
