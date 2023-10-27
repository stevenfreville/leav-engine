"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1({ 'core.infra.tree': treeRepo = null }) {
    return async (treeDataBefore, treeDataAfter, ctx) => {
        var _a;
        if (!treeDataAfter.libraries) {
            // If libraries have not changed, don't do anything
            return;
        }
        const oldTreeLibrariesIds = Object.keys((_a = treeDataBefore.libraries) !== null && _a !== void 0 ? _a : {});
        const newTreeLibraries = Object.keys(treeDataAfter.libraries);
        const removedLibraries = oldTreeLibrariesIds.filter(l => !newTreeLibraries.includes(l));
        // For each library, get all records presents in the tree
        for (const libraryId of removedLibraries) {
            const nodesToRemove = await treeRepo.getNodesByLibrary({ treeId: treeDataBefore.id, libraryId, ctx });
            // Detach them
            for (const nodeId of nodesToRemove) {
                await treeRepo.deleteElement({ treeId: treeDataBefore.id, nodeId, deleteChildren: true, ctx });
            }
        }
    };
}
exports.default = default_1;
