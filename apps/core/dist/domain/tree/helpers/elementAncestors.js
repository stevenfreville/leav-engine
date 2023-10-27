"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cacheService_1 = require("../../../infra/cache/cacheService");
function default_1({ 'core.infra.tree': treeRepo = null, 'core.infra.cache.cacheService': cacheService = null }) {
    const _getCacheKey = (treeId, nodeId) => `elementAncestors:${treeId}:${nodeId !== null && nodeId !== void 0 ? nodeId : '*'}`;
    return {
        getCachedElementAncestors: async ({ treeId, nodeId, ctx }) => {
            const _execute = async () => {
                return treeRepo.getElementAncestors({ treeId, nodeId, ctx });
            };
            const cacheKey = _getCacheKey(treeId, nodeId);
            return cacheService.memoize({ key: cacheKey, func: _execute, ctx });
        },
        clearElementAncestorsCache: async ({ treeId, ctx }) => {
            const cacheKey = _getCacheKey(treeId);
            const cache = cacheService.getCache(cacheService_1.ECacheType.RAM);
            cache.deleteData([cacheKey]);
        }
    };
}
exports.default = default_1;
