"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cacheService_1 = require("../../../infra/cache/cacheService");
const permissions_1 = require("../../../_types/permissions");
const _types_1 = require("../_types");
const getPermissionCacheKey_1 = __importDefault(require("./getPermissionCacheKey"));
function default_1(deps) {
    const { 'core.domain.attribute': attributeDomain = null, 'core.domain.permission.helpers.permissionByUserGroups': permByUserGroupsHelper = null, 'core.domain.permission.helpers.defaultPermission': defaultPermHelper = null, 'core.domain.permission.helpers.reducePermissionsArray': reducePermissionsArrayHelper = null, 'core.domain.tree.helpers.elementAncestors': elementAncestorsHelper = null, 'core.infra.cache.cacheService': cacheService = null } = deps;
    /**
     * Return permission for given permission tree attribute.
     * Get record's value on this tree attribute, then run through its ancestors to look for any permission defined
     *
     * @param params
     */
    const _getPermTreePermission = async (params) => {
        const { type, action, applyTo, userGroupsPaths, permTreeId, permTreeValues, ctx } = params;
        if (permTreeValues.length) {
            // Get permissions for all values, then check if we're allowed somewhere
            const allValuesPermissions = await Promise.all(permTreeValues.map(
            // Permissions for each values of tree attribute
            async (value) => {
                const permTreePath = await elementAncestorsHelper.getCachedElementAncestors({
                    // Ancestors of value
                    treeId: permTreeId,
                    nodeId: value,
                    ctx
                });
                let perm = null;
                for (const pathElem of permTreePath.reverse()) {
                    const valuePerm = await permByUserGroupsHelper.getPermissionByUserGroups({
                        type,
                        action,
                        userGroupsPaths,
                        applyTo,
                        permissionTreeTarget: {
                            nodeId: pathElem.id,
                            tree: permTreeId
                        },
                        ctx
                    });
                    if (valuePerm !== null) {
                        perm = valuePerm;
                        break;
                    }
                }
                return perm;
            }));
            // Looks for a true somewhere, but keeps null if everything is null
            const perm = reducePermissionsArrayHelper.reducePermissionsArray(allValuesPermissions);
            if (perm !== null) {
                return perm;
            }
        }
        // Nothing found on tree or no value defined, return root level permission
        const rootPerm = await permByUserGroupsHelper.getPermissionByUserGroups({
            type,
            action,
            userGroupsPaths,
            applyTo,
            permissionTreeTarget: {
                nodeId: null,
                tree: permTreeId
            },
            ctx
        });
        return rootPerm;
    };
    const getTreeBasedPermission = async (params, ctx) => {
        const { type, action, userId, applyTo, treeValues, permissions_conf, getDefaultPermission } = params;
        if (!permissions_conf.permissionTreeAttributes.length) {
            return getDefaultPermission({ action, applyTo, userId });
        }
        const key = permissions_conf.permissionTreeAttributes.reduce((acc, permTreeAttr) => {
            const values = treeValues[permTreeAttr];
            return values.length ? acc + `${acc.length ? '_' : ''}${values.join('_')}` : acc;
        }, '');
        const cacheKey = (0, getPermissionCacheKey_1.default)(ctx.groupsId, type, applyTo, action, key);
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
                ? await Promise.all(ctx.groupsId.map(async (groupId) => elementAncestorsHelper.getCachedElementAncestors({
                    treeId: 'users_groups',
                    nodeId: groupId,
                    ctx
                })))
                : [];
            const treePerms = await Promise.all(permissions_conf.permissionTreeAttributes.map(async (permTreeAttr) => {
                const permTreeAttrProps = await attributeDomain.getAttributeProperties({ id: permTreeAttr, ctx });
                const treePerm = await _getPermTreePermission({
                    type,
                    action,
                    applyTo,
                    userGroupsPaths,
                    permTreeId: permTreeAttrProps.linked_tree,
                    permTreeValues: treeValues[permTreeAttr],
                    ctx
                });
                return treePerm !== null && treePerm !== void 0 ? treePerm : getDefaultPermission({ action, applyTo, userId });
            }));
            perm = treePerms.reduce((globalPerm, treePerm) => {
                if (globalPerm === null) {
                    return treePerm;
                }
                return permissions_conf.relation === permissions_1.PermissionsRelations.AND
                    ? globalPerm && treePerm
                    : globalPerm || treePerm;
            }, null);
            const permToStore = perm === null ? _types_1.PERMISSIONS_NULL_PLACEHOLDER : perm.toString();
            await cacheService.getCache(cacheService_1.ECacheType.RAM).storeData({ key: cacheKey, data: permToStore });
        }
        return perm;
    };
    const getInheritedTreeBasedPermission = async (params, ctx) => {
        const { type, action, userGroupId, applyTo, permissionTreeTarget, getDefaultPermission } = params;
        // Get perm for user group's parent
        const groupAncestors = await elementAncestorsHelper.getCachedElementAncestors({
            treeId: 'users_groups',
            nodeId: userGroupId,
            ctx
        });
        const parentPerm = await permByUserGroupsHelper.getPermissionByUserGroups({
            type,
            action,
            userGroupsPaths: [groupAncestors.slice(0, -1)],
            applyTo,
            permissionTreeTarget,
            ctx
        });
        if (parentPerm !== null) {
            return parentPerm;
        }
        const treeElemAncestors = await elementAncestorsHelper.getCachedElementAncestors({
            treeId: permissionTreeTarget.tree,
            nodeId: permissionTreeTarget.nodeId,
            ctx
        });
        const perm = await _getPermTreePermission({
            type,
            action,
            applyTo,
            userGroupsPaths: [groupAncestors],
            permTreeId: permissionTreeTarget.tree,
            permTreeValues: treeElemAncestors.map(anc => anc.id),
            ctx
        });
        if (perm !== null) {
            return perm;
        }
        // Nothing found? Return library permission
        const libPerm = await getDefaultPermission({
            action,
            applyTo,
            userGroups: [groupAncestors]
        });
        return libPerm !== null ? libPerm : defaultPermHelper.getDefaultPermission();
    };
    return {
        getTreeBasedPermission,
        getInheritedTreeBasedPermission
    };
}
exports.default = default_1;
