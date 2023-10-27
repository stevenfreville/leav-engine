"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1({ 'core.infra.library': libraryRepo = null, 'core.infra.attribute': attributeRepo = null, 'core.infra.tree': treeRepo = null, 'core.infra.view': viewRepo = null, 'core.infra.versionProfile': versionProfileRepo = null, 'core.infra.cache.cacheService': cacheService = null, 'core.utils': utils = null }) {
    const getCoreEntityById = async function (entityType, entityId, ctx) {
        const _execute = async () => {
            let result;
            switch (entityType) {
                case 'library':
                    result = await libraryRepo.getLibraries({
                        params: { filters: { id: entityId }, strictFilters: true },
                        ctx
                    });
                    break;
                case 'attribute':
                    result = await attributeRepo.getAttributes({
                        params: { filters: { id: entityId }, strictFilters: true },
                        ctx
                    });
                    break;
                case 'tree':
                    result = await treeRepo.getTrees({ params: { filters: { id: entityId }, strictFilters: true }, ctx });
                    break;
                case 'view':
                    result = await viewRepo.getViews({ filters: { id: entityId }, strictFilters: true }, ctx);
                case 'versionProfile':
                    result = await versionProfileRepo.getVersionProfiles({
                        params: { filters: { id: entityId }, strictFilters: true },
                        ctx
                    });
                    break;
            }
            if (!result.list.length) {
                return null;
            }
            return result.list[0];
        };
        const cacheKey = utils.getCoreEntityCacheKey(entityType, entityId);
        // Due to race conditions, we sometimes get null when retrieving a newly created core entity. Thus, we don't
        // want to keep this "false" null in cache
        const res = await cacheService.memoize({ key: cacheKey, func: _execute, storeNulls: false, ctx });
        return res;
    };
    return getCoreEntityById;
}
exports.default = default_1;
