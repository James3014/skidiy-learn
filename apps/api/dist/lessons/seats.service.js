var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { toSeatResponse } from './dto/seat-response.dto.js';
let SeatsService = class SeatsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findBySeatId(seatId) {
        const seat = await this.prisma.orderSeat.findUnique({
            where: { id: seatId },
            include: {
                claimedMapping: {
                    include: {
                        selfEvaluations: true
                    }
                }
            }
        });
        if (!seat) {
            throw new NotFoundException(`Seat with id ${seatId} not found`);
        }
        return toSeatResponse(seat, seat.lessonId);
    }
    async getSeatIdentityForm(seatId) {
        const form = await this.prisma.seatIdentityForm.findUnique({
            where: { seatId }
        });
        if (!form) {
            throw new NotFoundException(`Identity form for seat ${seatId} not found`);
        }
        return form;
    }
    async updateSeatIdentityForm(seatId, data) {
        const form = await this.prisma.seatIdentityForm.findUnique({
            where: { seatId }
        });
        if (!form) {
            throw new NotFoundException(`Identity form for seat ${seatId} not found`);
        }
        return this.prisma.seatIdentityForm.update({
            where: { seatId },
            data: {
                ...data,
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                updatedAt: new Date()
            }
        });
    }
};
SeatsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], SeatsService);
export { SeatsService };
//# sourceMappingURL=seats.service.js.map