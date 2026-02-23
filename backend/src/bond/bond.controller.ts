import { Body, Controller, Inject, Post } from "@nestjs/common";
import { CalculateBondDto } from "./dto/calculate-bond.dto";
import { BondService } from "./bond.service";

@Controller("bond")
export class BondController {
  constructor(@Inject(BondService) private readonly bondService: BondService) {}

  @Post("calculate")
  calculate(@Body() payload: CalculateBondDto) {
    return this.bondService.calculate(payload);
  }
}
