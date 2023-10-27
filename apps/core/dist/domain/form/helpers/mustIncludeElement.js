"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mustIncludeElement = void 0;
/**
 * Check if element must be included in form based on dependencies
 */
const mustIncludeElement = async (element, recordId, libraryId, { 'core.domain.record': recordDomain = null, 'core.domain.tree': treeDomain = null }, ctx) => {
    if (!element.dependencyValue) {
        return true;
    }
    // Get dependency value
    const recordDepValue = recordId
        ? await recordDomain.getRecordFieldValue({
            library: libraryId,
            attributeId: element.dependencyValue.attribute,
            record: {
                id: recordId,
                library: libraryId
            },
            ctx
        })
        : [];
    const depValues = Array.isArray(recordDepValue) || !recordDepValue
        ? recordDepValue
        : [recordDepValue];
    // Get ancestors of value
    // For each ancestor, retrieve associated fields to check if field must be included
    let isFound = false;
    for (const depValue of depValues !== null && depValues !== void 0 ? depValues : []) {
        const ancestors = await treeDomain.getElementAncestors({
            treeId: depValue.treeId,
            nodeId: depValue.value.id,
            ctx
        });
        isFound = ancestors.some(ancestor => ancestor.id === element.dependencyValue.value);
        if (isFound) {
            break;
        }
    }
    return isFound;
};
exports.mustIncludeElement = mustIncludeElement;
