"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const library_1 = require("../../../_types/library");
exports.default = ({ 'core.domain.tree': treeDomain, 'core.infra.tree': treeRepo = null, 'core.utils': utils = null }) => {
    const _filesBehavior = (library, ctx) => treeRepo.deleteTree({ id: utils.getLibraryTreeId(library.id), ctx });
    return async (library, ctx) => {
        // Remove library from tree where it's used
        const libraryTrees = await treeDomain.getTrees({
            params: {
                filters: {
                    library: library.id
                }
            },
            ctx
        });
        for (const tree of libraryTrees.list) {
            const newTreeLibraries = Object.assign({}, tree.libraries);
            delete newTreeLibraries[library.id];
            await treeDomain.saveTree(Object.assign(Object.assign({}, tree), { libraries: newTreeLibraries }), ctx);
        }
        // Run action by behavior
        const actionByBehavior = {
            [library_1.LibraryBehavior.FILES]: () => _filesBehavior(library, ctx)
        };
        if (actionByBehavior[library.behavior]) {
            actionByBehavior[library.behavior]();
        }
    };
};
