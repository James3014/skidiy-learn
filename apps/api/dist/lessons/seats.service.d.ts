import { PrismaService } from '../prisma/prisma.service.js';
import { SeatResponseDto } from './dto/seat-response.dto.js';
export declare class SeatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findBySeatId(seatId: string): Promise<SeatResponseDto>;
    getSeatIdentityForm(seatId: string): Promise<{
        id: string;
        seatId: string;
        status: import("@prisma/client").$Enums.SeatIdentityStatus;
        studentName: string | null;
        studentEnglish: string | null;
        birthDate: Date | null;
        contactEmail: string | null;
        guardianEmail: string | null;
        contactPhone: string | null;
        isMinor: boolean;
        hasExternalInsurance: boolean;
        insuranceProvider: string | null;
        note: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateSeatIdentityForm(seatId: string, data: {
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
    }): Promise<{
        id: string;
        seatId: string;
        status: import("@prisma/client").$Enums.SeatIdentityStatus;
        studentName: string | null;
        studentEnglish: string | null;
        birthDate: Date | null;
        contactEmail: string | null;
        guardianEmail: string | null;
        contactPhone: string | null;
        isMinor: boolean;
        hasExternalInsurance: boolean;
        insuranceProvider: string | null;
        note: string | null;
        submittedAt: Date | null;
        confirmedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
