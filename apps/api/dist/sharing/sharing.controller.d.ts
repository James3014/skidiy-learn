import { SharingService } from './sharing.service.js';
export declare class SharingController {
    private readonly sharingService;
    constructor(sharingService: SharingService);
    updateVisibility(detailId: string, visibility: 'private' | 'resort' | 'all', accountId: string): Promise<{
        id: string;
        lessonRecordId: string;
        studentMappingId: string;
        resortId: number;
        shareVisibility: import("@prisma/client").$Enums.RecordShareVisibility;
        studentTypes: import("@prisma/client").$Enums.StudentPersona[];
        sharedAt: Date | null;
        sharedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    querySharedRecords(resortId: string | undefined, sportType: string | undefined, limit: string | undefined, accountId: string): Promise<import("./sharing.service.js").SharedRecordResult[]>;
}
