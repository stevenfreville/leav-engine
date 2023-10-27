"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cacheService_1 = require("../../../infra/cache/cacheService");
function default_1({ 'core.infra.tree': treeRepo = null, 'core.infra.cache.cacheService': cacheService = null, 'core.utils': utils = null }) {
    const _getCacheKey = treeId => `${utils.getCoreEntityCacheKey('tree', treeId)}:defaultElement`;
    return {
        async getDefaultElement({ treeId, ctx }) {
            const _execute = async () => {
                var _a;
                // TODO Change this behavior
                // for now, get first element in tree
                const treeContent = await treeRepo.getTreeContent({ treeId, ctx });
                return (_a = treeContent === null || treeContent === void 0 ? void 0 : treeContent[0]) !== null && _a !== void 0 ? _a : null;
            };
            return cacheService.memoize({ key: _getCacheKey(treeId), func: _execute, ctx });
        },
        async clearCache({ treeId, ctx }) {
            const cacheKey = _getCacheKey(treeId);
            const cache = cacheService.getCache(cacheService_1.ECacheType.RAM);
            cache.deleteData([cacheKey]);
        }
    };
}
exports.default = default_1;
