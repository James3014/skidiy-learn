export function mapSkill(skill, drills) {
    return {
        id: skill.id,
        name: skill.name,
        nameEn: skill.nameEn ?? null,
        sportType: skill.sportType,
        description: skill.description ?? null,
        displayOrder: skill.displayOrder,
        drills: drills.map(mapDrill)
    };
}
export function mapDrill(drill) {
    return {
        id: drill.id,
        skillId: drill.skillId,
        name: drill.name,
        nameEn: drill.nameEn ?? null,
        description: drill.description ?? null,
        sportType: drill.sportType,
        displayOrder: drill.displayOrder
    };
}
//# sourceMappingURL=skill-response.dto.js.map