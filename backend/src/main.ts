import "reflect-metadata";
import { json, urlencoded } from "express";
import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SafeHttpExceptionFilter } from "./common/safe-http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(json({ limit: "32kb" }));
  app.use(urlencoded({ extended: false, limit: "32kb" }));
  app.useGlobalFilters(new SafeHttpExceptionFilter());
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
