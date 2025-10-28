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

export function mapIdentity(form: SeatIdentityForm): SeatIdentityFormResponse {
  return {
    id: form.id,
    seatId: form.seatId,
    status: form.status,
    studentName: form.studentName ?? null,
    studentEnglish: form.studentEnglish ?? null,
    birthDate: form.birthDate ? form.birthDate.toISOString() : null,
    contactEmail: form.contactEmail ?? null,
    guardianEmail: form.guardianEmail ?? null,
    contactPhone: form.contactPhone ?? null,
    isMinor: form.isMinor,
    hasExternalInsurance: form.hasExternalInsurance,
    insuranceProvider: form.insuranceProvider ?? null,
    note: form.note ?? null,
    submittedAt: form.submittedAt ? form.submittedAt.toISOString() : null,
    confirmedAt: form.confirmedAt ? form.confirmedAt.toISOString() : null
  };
}
