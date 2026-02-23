import { BadRequestException, Body, Controller, Inject, Post } from "@nestjs/common";
import { ZodError } from "zod";
import { parseBondInput } from "./bond.schema";
import { BondService } from "./bond.service";

@Controller("bond")
export class BondController {
  constructor(@Inject(BondService) private readonly bondService: BondService) {}

  @Post("calculate")
  calculate(@Body() payload: unknown) {
    try {
      const input = parseBondInput(payload);
      return this.bondService.calculate(input);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid bond inputs.",
          errors: error.issues.map((issue) => issue.message)
        });
      }
      throw error;
    }
  }
}
