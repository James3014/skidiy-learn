import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller.js';
import { SeatsController } from './seats.controller.js';
import { InvitationsController } from './invitations.controller.js';
import { LessonsService } from './lessons.service.js';
import { SeatsService } from './seats.service.js';
import { InvitationsService } from './invitations.service.js';

@Module({
  controllers: [
    LessonsController,
    SeatsController,
    InvitationsController
  ],
  providers: [
    LessonsService,
    SeatsService,
    InvitationsService
  ],
  exports: [
    LessonsService,
    SeatsService,
    InvitationsService
  ]
})
export class LessonsModule {}
