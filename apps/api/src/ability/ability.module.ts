import { Module } from '@nestjs/common';
import { AbilityController } from './ability.controller.js';
import { AbilityService } from './ability.service.js';

@Module({
  controllers: [AbilityController],
  providers: [AbilityService]
})
export class AbilityModule {}
