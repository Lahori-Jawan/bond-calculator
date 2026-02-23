import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { BondModule } from "./bond/bond.module";
import { BondController } from "./bond/bond.controller";
import { RateLimitMiddleware } from "./common/rate-limit.middleware";

@Module({
  imports: [BondModule]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes(BondController);
  }
}
