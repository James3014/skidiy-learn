export function mapGroup(group, items) {
    return {
        id: group.id,
        name: group.name,
        sportType: group.sportType,
        description: group.description,
        displayOrder: group.displayOrder,
        items: items.map(mapItem)
    };
}
export function mapItem(item) {
    return {
        id: item.id,
        groupId: item.groupId,
        name: item.name,
        description: item.description,
        sportType: item.sportType,
        displayOrder: item.displayOrder
    };
}
//# sourceMappingURL=analysis-item.response.js.map