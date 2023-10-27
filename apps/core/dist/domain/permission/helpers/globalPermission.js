"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cacheService_1 = require("../../../infra/cache/cacheService");
const _types_1 = require("../_types");
const getPermissionCacheKey_1 = __importDefault(require("./getPermissionCacheKey"));
function default_1({ 'core.domain.permission.helpers.permissionByUserGroups': permByUserGroupsHelper = null, 'core.domain.permission.helpers.defaultPermission': defaultPermHelper = null, 'core.infra.attribute': attributeRepo = null, 'core.infra.value': valueRepo = null, 'core.infra.tree': treeRepo = null, 'core.infra.cache.cacheService': cacheService = null }) {
    return {
        async getGlobalPermission({ type, applyTo, userId, action, getDefaultPermission = defaultPermHelper.getDefaultPermission }, ctx) {
            const cacheKey = (0, getPermissionCacheKey_1.default)(ctx.groupsId, type, applyTo, action, '');
            const permFromCache = (await cacheService.getCache(cacheService_1.ECacheType.RAM).getData([cacheKey]))[0];
            let perm;
            if (permFromCache !== null) {
                if (permFromCache === _types_1.PERMISSIONS_NULL_PLACEHOLDER) {
                    perm = null;
                }
                else {
                    perm = permFromCache === 'true';
                }
            }
            else {
                const userGroupsPaths = !!ctx.groupsId
                    ? await Promise.all(ctx.groupsId.map(async (groupId) => treeRepo.getElementAncestors({
                        treeId: 'users_groups',
                        nodeId: groupId,
                        ctx
                    })))
                    : [];
                perm = await permByUserGroupsHelper.getPermissionByUserGroups({
                    type,
                    action,
                    userGroupsPaths,
                    applyTo,
                    ctx
                });
                const permToStore = perm === null ? _types_1.PERMISSIONS_NULL_PLACEHOLDER : perm.toString();
                await cacheService.getCache(cacheService_1.ECacheType.RAM).storeData({ key: cacheKey, data: permToStore });
            }
            return perm !== null && perm !== void 0 ? perm : getDefaultPermission({ action, applyTo, type, userId, ctx });
        },
        async getInheritedGlobalPermission({ type, applyTo, userGroupNodeId, action, getDefaultPermission = defaultPermHelper.getDefaultPermission }, ctx) {
            // Get perm for user group's parent
            const groupAncestors = await treeRepo.getElementAncestors({
                treeId: 'users_groups',
                nodeId: userGroupNodeId,
                ctx
            });
            const perm = await permByUserGroupsHelper.getPermissionByUserGroups({
                type,
                action,
                userGroupsPaths: [groupAncestors.slice(0, -1)],
                applyTo,
                ctx
            });
            return perm !== null ? perm : getDefaultPermission();
        }
    };
}
exports.default = default_1;
