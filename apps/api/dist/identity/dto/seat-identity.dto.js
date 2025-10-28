export function mapIdentity(form) {
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
//# sourceMappingURL=seat-identity.dto.js.map