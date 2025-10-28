var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller.js';
import { SeatsController } from './seats.controller.js';
import { InvitationsController } from './invitations.controller.js';
import { LessonsService } from './lessons.service.js';
import { SeatsService } from './seats.service.js';
import { InvitationsService } from './invitations.service.js';
let LessonsModule = class LessonsModule {
};
LessonsModule = __decorate([
    Module({
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
], LessonsModule);
export { LessonsModule };
//# sourceMappingURL=lessons.module.js.map