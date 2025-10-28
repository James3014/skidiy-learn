import { SeatIdentityForm, $Enums } from '@prisma/client';
export type SeatIdentityStatus = $Enums.SeatIdentityStatus;
export interface SeatIdentityFormResponse {
    id: string;
    seatId: string;
    status: SeatIdentityStatus;
    studentName: string | null;
    studentEnglish: string | null;
    birthDate: string | null;
    contactEmail: string | null;
    guardianEmail: string | null;
    contactPhone: string | null;
    isMinor: boolean;
    hasExternalInsurance: boolean;
    insuranceProvider: string | null;
    note: string | null;
    submittedAt: string | null;
    confirmedAt: string | null;
}
export declare function mapIdentity(form: SeatIdentityForm): SeatIdentityFormResponse;
