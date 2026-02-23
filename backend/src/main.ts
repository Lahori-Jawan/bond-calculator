import "reflect-metadata";
import { json, urlencoded } from "express";
import helmet from "helmet";
import {
  BadRequestException,
  ValidationError,
  ValidationPipe
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SafeHttpExceptionFilter } from "./common/safe-http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(json({ limit: "32kb" }));
  app.use(urlencoded({ extended: false, limit: "32kb" }));
  app.useGlobalFilters(new SafeHttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException({
          message: "Invalid bond inputs.",
          errors: flattenValidationErrors(errors)
        })
    })
  );
  app.setGlobalPrefix("api");

  const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

bootstrap().catch((error: unknown) => {
  // Avoid dumping request/user data in logs.
  console.error("Failed to start backend", error);
  process.exit(1);
});

function flattenValidationErrors(errors: ValidationError[]): string[] {
  const output: string[] = [];

  for (const error of errors) {
    if (error.constraints) {
      output.push(...Object.values(error.constraints));
    }
    if (error.children?.length) {
      output.push(...flattenValidationErrors(error.children));
    }
  }

  return output.length ? output : ["Invalid request payload."];
}
