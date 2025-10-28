import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SeatResponseDto, toSeatResponse } from './dto/seat-response.dto.js';

@Injectable()
export class SeatsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySeatId(seatId: string): Promise<SeatResponseDto> {
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

  async getSeatIdentityForm(seatId: string) {
    const form = await this.prisma.seatIdentityForm.findUnique({
      where: { seatId }
    });

    if (!form) {
      throw new NotFoundException(`Identity form for seat ${seatId} not found`);
    }

    return form;
  }

  async updateSeatIdentityForm(
    seatId: string,
    data: {
      studentName?: string;
      studentEnglish?: string;
      birthDate?: string;
      contactEmail?: string;
      guardianEmail?: string;
      contactPhone?: string;
      isMinor?: boolean;
      hasExternalInsurance?: boolean;
      insuranceProvider?: string;
      note?: string;
    }
  ) {
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
}
