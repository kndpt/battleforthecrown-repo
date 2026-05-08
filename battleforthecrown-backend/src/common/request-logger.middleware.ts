import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    // Log quand la requête est terminée
    res.on('finish', () => {
      const method = req.method;
      const statusCode = res.statusCode;
      const url = req.url;

      // Format simple: GET 200 - "/health"
      this.logger.log(`${method} ${statusCode} - "${url}"`);
    });

    next();
  }
}
