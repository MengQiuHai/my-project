import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ResponseHelper {
  static success<T>(
    res: Response,
    data?: T,
    message: string = 'Success',
    statusCode: number = 200
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    
    res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string = 'Error occurred',
    statusCode: number = 400,
    errors?: string[]
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      errors,
    };
    
    res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Success'
  ): void {
    const totalPages = Math.ceil(total / limit);
    
    const response: ApiResponse<T[]> = {
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
    
    res.status(200).json(response);
  }

  static created<T>(
    res: Response,
    data?: T,
    message: string = 'Resource created successfully'
  ): void {
    this.success(res, data, message, 201);
  }

  static updated<T>(
    res: Response,
    data?: T,
    message: string = 'Resource updated successfully'
  ): void {
    this.success(res, data, message, 200);
  }

  static deleted(
    res: Response,
    message: string = 'Resource deleted successfully'
  ): void {
    this.success(res, null, message, 200);
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): void {
    this.error(res, message, 404);
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized access'
  ): void {
    this.error(res, message, 401);
  }

  static forbidden(
    res: Response,
    message: string = 'Forbidden access'
  ): void {
    this.error(res, message, 403);
  }

  static conflict(
    res: Response,
    message: string = 'Resource conflict'
  ): void {
    this.error(res, message, 409);
  }

  static validationError(
    res: Response,
    errors: string[],
    message: string = 'Validation failed'
  ): void {
    this.error(res, message, 400, errors);
  }

  static serverError(
    res: Response,
    message: string = 'Internal server error'
  ): void {
    this.error(res, message, 500);
  }
}