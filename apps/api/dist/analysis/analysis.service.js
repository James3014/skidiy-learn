var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { mapGroup } from './dto/analysis-item.response.js';
let AnalysisService = class AnalysisService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listGroups() {
        const groups = await this.prisma.analysisGroup.findMany({
            orderBy: [{ sportType: 'asc' }, { displayOrder: 'asc' }]
        });
        const items = await this.prisma.analysisItem.findMany({
            orderBy: [{ sportType: 'asc' }, { displayOrder: 'asc' }]
        });
        const itemsByGroup = new Map();
        for (const item of items) {
            if (!itemsByGroup.has(item.groupId)) {
                itemsByGroup.set(item.groupId, []);
            }
            itemsByGroup.get(item.groupId).push(item);
        }
        return groups.map((group) => mapGroup(group, itemsByGroup.get(group.id) ?? []));
    }
};
AnalysisService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], AnalysisService);
export { AnalysisService };
//# sourceMappingURL=analysis.service.js.map