import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware
} from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly windowMs = 60_000;
  private readonly maxRequests = 60;
  private readonly buckets = new Map<string, Bucket>();

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const current = this.buckets.get(ip);

    if (!current || current.resetAt < now) {
      this.buckets.set(ip, { count: 1, resetAt: now + this.windowMs });
      res.setHeader("X-RateLimit-Limit", String(this.maxRequests));
      res.setHeader("X-RateLimit-Remaining", String(this.maxRequests - 1));
      return next();
    }

    current.count += 1;
    res.setHeader("X-RateLimit-Limit", String(this.maxRequests));
    res.setHeader(
      "X-RateLimit-Remaining",
      String(Math.max(0, this.maxRequests - current.count))
    );

    if (current.count > this.maxRequests) {
      throw new HttpException(
        "Too many requests. Try again shortly.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return next();
  }
}
