"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PermissionError_1 = __importDefault(require("../../errors/PermissionError"));
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const cacheService_1 = require("../../infra/cache/cacheService");
const errors_1 = require("../../_types/errors");
const permissions_1 = require("../../_types/permissions");
const getPermissionCachePatternKey_1 = __importDefault(require("./helpers/getPermissionCachePatternKey"));
function default_1(deps = {}) {
    const _pluginPermissions = {};
    const { 'core.domain.permission.admin': adminPermissionDomain = null, 'core.domain.permission.record': recordPermissionDomain = null, 'core.domain.permission.library': libraryPermissionDomain = null, 'core.domain.permission.attribute': attributePermissionDomain = null, 'core.domain.permission.recordAttribute': recordAttributePermissionDomain = null, 'core.domain.permission.tree': treePermissionDomain = null, 'core.domain.permission.treeNode': treeNodePermissionDomain = null, 'core.domain.permission.treeLibrary': treeLibraryPermissionDomain = null, 'core.domain.permission.application': applicationPermissionDomain = null, 'core.infra.permission': permissionRepo = null, 'core.infra.cache.cacheService': cacheService = null, config = null } = deps;
    const _cleanCacheOnSavingPermissions = async (permData) => {
        // clean permissions cached
        for (const [name, v] of Object.entries(permData.actions)) {
            const keys = [];
            keys.push((0, getPermissionCachePatternKey_1.default)({
                permissionType: permData.type,
                applyTo: permData.applyTo,
                permissionAction: name
            }));
            if (permData.type === permissions_1.PermissionTypes.TREE) {
                keys.push((0, getPermissionCachePatternKey_1.default)({
                    permissionType: permissions_1.PermissionTypes.TREE_LIBRARY,
                    applyTo: permData.applyTo,
                    permissionAction: name
                }), (0, getPermissionCachePatternKey_1.default)({
                    permissionType: permissions_1.PermissionTypes.TREE_NODE,
                    applyTo: permData.applyTo,
                    permissionAction: name
                }));
            }
            if (permData.type === permissions_1.PermissionTypes.LIBRARY) {
                keys.push((0, getPermissionCachePatternKey_1.default)({
                    permissionType: permissions_1.PermissionTypes.RECORD,
                    applyTo: permData.applyTo,
                    permissionAction: name
                }));
            }
            if (permData.type === permissions_1.PermissionTypes.ATTRIBUTE) {
                keys.push((0, getPermissionCachePatternKey_1.default)({
                    permissionType: permissions_1.PermissionTypes.RECORD_ATTRIBUTE,
                    applyTo: permData.applyTo,
                    permissionAction: name
                }));
            }
            if (permData.type === permissions_1.PermissionTypes.APPLICATION) {
                keys.push((0, getPermissionCachePatternKey_1.default)({
                    permissionType: permissions_1.PermissionTypes.APPLICATION,
                    applyTo: permData.applyTo,
                    permissionAction: name
                }));
            }
            await cacheService.getCache(cacheService_1.ECacheType.RAM).deleteData(keys);
        }
    };
    const savePermission = async (permData, ctx) => {
        // Does user have the permission to save permissions?
        const action = permissions_1.AdminPermissionsActions.EDIT_PERMISSION;
        const canSavePermission = await adminPermissionDomain.getAdminPermission({
            action,
            userId: ctx.userId,
            ctx
        });
        if (!canSavePermission) {
            throw new PermissionError_1.default(action);
        }
        await _cleanCacheOnSavingPermissions(permData);
        return permissionRepo.savePermission({ permData, ctx });
    };
    const getPermissionsByActions = async (params) => {
        const { type, applyTo, actions, usersGroupNodeId: usersGroupId, permissionTreeTarget, ctx } = params;
        const perms = await permissionRepo.getPermissions({
            type,
            applyTo,
            usersGroupNodeId: usersGroupId,
            permissionTreeTarget,
            ctx
        });
        return actions.reduce((actionsPerms, action) => {
            actionsPerms[action] =
                perms !== null && typeof perms.actions[action] !== 'undefined' ? perms.actions[action] : null;
            return actionsPerms;
        }, {});
    };
    const getInheritedPermissions = async ({ type, applyTo, action, userGroupId, permissionTreeTarget, ctx }) => {
        let perm;
        switch (type) {
            case permissions_1.PermissionTypes.RECORD:
                perm = await recordPermissionDomain.getInheritedRecordPermission({
                    action: action,
                    userGroupId,
                    library: applyTo,
                    permTree: permissionTreeTarget.tree,
                    permTreeNode: permissionTreeTarget.nodeId,
                    ctx
                });
                break;
            case permissions_1.PermissionTypes.RECORD_ATTRIBUTE:
                perm = recordAttributePermissionDomain.getInheritedRecordAttributePermission({
                    attributeId: applyTo,
                    action: action,
                    userGroupId,
                    permTree: permissionTreeTarget.tree,
                    permTreeNode: permissionTreeTarget.nodeId
                }, ctx);
                break;
            case permissions_1.PermissionTypes.LIBRARY:
                action = action;
                perm = await libraryPermissionDomain.getInheritedLibraryPermission({
                    action,
                    libraryId: applyTo,
                    userGroupId,
                    ctx
                });
                break;
            case permissions_1.PermissionTypes.ATTRIBUTE:
                action = action;
                perm = await attributePermissionDomain.getInheritedAttributePermission({
                    action,
                    attributeId: applyTo,
                    userGroupId,
                    ctx
                });
                break;
            case permissions_1.PermissionTypes.ADMIN:
                action = action;
                perm = await adminPermissionDomain.getInheritedAdminPermission({
                    action,
                    userGroupId,
                    ctx
                });
                break;
            case permissions_1.PermissionTypes.TREE:
                perm = await treePermissionDomain.getInheritedTreePermission({
                    action: action,
                    treeId: applyTo,
                    userGroupId,
                    ctx
                });
                break;
            case permissions_1.PermissionTypes.TREE_NODE: {
                const [treeId, libraryId] = applyTo.split('/');
                perm = await treeNodePermissionDomain.getInheritedTreeNodePermission({
                    action: action,
                    treeId,
                    libraryId,
                    userGroupId,
                    permTree: permissionTreeTarget.tree,
                    permTreeNode: permissionTreeTarget.nodeId,
                    ctx
                });
                break;
            }
            case permissions_1.PermissionTypes.TREE_LIBRARY: {
                const [treeId, libraryId] = applyTo.split('/');
                perm = await treeLibraryPermissionDomain.getInheritedTreeLibraryPermission({
                    action: action,
                    treeId,
                    libraryId,
                    userGroupId,
                    ctx
                });
                break;
            }
            case permissions_1.PermissionTypes.APPLICATION: {
                action = action;
                perm = await applicationPermissionDomain.getInheritedApplicationPermission({
                    action,
                    applicationId: applyTo,
                    userGroupId,
                    ctx
                });
                break;
            }
        }
        return perm;
    };
    const isAllowed = async ({ type, action, userId, applyTo, target, ctx }) => {
        let perm;
        switch (type) {
            case permissions_1.PermissionTypes.RECORD:
                if (!target || !target.recordId) {
                    throw new ValidationError_1.default({ target: errors_1.Errors.MISSING_RECORD_ID });
                }
                perm = await recordPermissionDomain.getRecordPermission({
                    action: action,
                    userId,
                    library: applyTo,
                    recordId: target.recordId,
                    ctx
                });
                break;
            case permissions_1.PermissionTypes.RECORD_ATTRIBUTE:
                const errors = [];
                if (!target) {
                    throw new ValidationError_1.default({ target: errors_1.Errors.MISSING_TARGET });
                }
                if (!target.recordId) {
                    errors.push('recordId');
                }
                if (!target.attributeId) {
                    errors.push('attributeId');
                }
                if (errors.length) {
                    throw new ValidationError_1.default({
                        target: { msg: errors_1.Errors.MISSING_FIELDS, vars: { fields: errors.join(', ') } }
                    });
                }
                perm = recordAttributePermissionDomain.getRecordAttributePermission(action, userId, target.attributeId, applyTo, target.recordId, ctx);
                break;
            case permissions_1.PermissionTypes.LIBRARY:
                action = action;
                perm = await libraryPermissionDomain.getLibraryPermission({
                    action,
                    libraryId: applyTo,
                    userId,
                    ctx
                });
                break;
            case permissions_1.PermissionTypes.ATTRIBUTE:
                action = action;
                perm = await attributePermissionDomain.getAttributePermission({
                    action,
                    attributeId: applyTo,
                    ctx
                });
                break;
            case permissions_1.PermissionTypes.ADMIN:
                action = action;
                perm = await adminPermissionDomain.getAdminPermission({
                    action,
                    userId,
                    ctx
                });
                break;
            case permissions_1.PermissionTypes.TREE:
                action = action;
                perm = await treePermissionDomain.getTreePermission({
                    action,
                    treeId: applyTo,
                    userId,
                    ctx
                });
                break;
            case permissions_1.PermissionTypes.TREE_NODE:
                if (!target.nodeId) {
                    throw new ValidationError_1.default({
                        target: { msg: errors_1.Errors.MISSING_FIELDS, vars: { fields: 'nodeId' } }
                    });
                }
                perm = await treeNodePermissionDomain.getTreeNodePermission({
                    action: action,
                    userId,
                    treeId: applyTo,
                    nodeId: target.nodeId,
                    ctx
                });
                break;
            case permissions_1.PermissionTypes.TREE_LIBRARY:
                const [treeId, libraryId] = applyTo.split('/');
                perm = await treeLibraryPermissionDomain.getTreeLibraryPermission({
                    action: action,
                    userId,
                    treeId,
                    libraryId,
                    ctx
                });
                break;
            case permissions_1.PermissionTypes.APPLICATION:
                action = action;
                perm = await applicationPermissionDomain.getApplicationPermission({
                    action,
                    applicationId: applyTo,
                    userId,
                    ctx
                });
                break;
        }
        return perm;
    };
    const getActionsByType = ({ type, applyOn, skipApplyOn = false }) => {
        var _a;
        let perms = [];
        switch (type) {
            case permissions_1.PermissionTypes.ADMIN:
                perms = Object.values(permissions_1.AdminPermissionsActions);
                break;
            case permissions_1.PermissionTypes.LIBRARY:
                perms = Object.values(permissions_1.LibraryPermissionsActions);
                break;
            case permissions_1.PermissionTypes.RECORD:
                perms = Object.values(permissions_1.RecordPermissionsActions);
                break;
            case permissions_1.PermissionTypes.ATTRIBUTE:
                perms = Object.values(permissions_1.AttributePermissionsActions);
                break;
            case permissions_1.PermissionTypes.RECORD_ATTRIBUTE:
                perms = Object.values(permissions_1.RecordAttributePermissionsActions);
                break;
            case permissions_1.PermissionTypes.TREE:
                perms = Object.values(permissions_1.TreePermissionsActions);
            case permissions_1.PermissionTypes.TREE_LIBRARY:
            case permissions_1.PermissionTypes.TREE_NODE:
                perms = Object.values(permissions_1.TreeNodePermissionsActions);
                break;
            case permissions_1.PermissionTypes.APPLICATION:
                perms = Object.values(permissions_1.ApplicationPermissionsActions);
                break;
        }
        // Retrieve plugin permissions, applying filter if applyOn is specified
        const pluginPermissions = ((_a = _pluginPermissions[type]) !== null && _a !== void 0 ? _a : [])
            .filter(p => skipApplyOn || !p.applyOn || p.applyOn.indexOf(applyOn) !== -1)
            .map(p => p.name);
        const res = [...perms, ...pluginPermissions].map(p => ({
            name: p,
            label: config.lang.available.reduce(
            // Retrieve label for all available languages
            (acc, l) => (Object.assign(Object.assign({}, acc), { [l]: deps.translator.t(`permissions.${p}`, { lng: l }) })), {})
        }));
        return res;
    };
    const registerActions = (type, actions, applyOn) => {
        var _a;
        _pluginPermissions[type] = [...((_a = _pluginPermissions[type]) !== null && _a !== void 0 ? _a : []), ...actions.map(a => ({ name: a, applyOn }))];
    };
    return {
        savePermission,
        getPermissionsByActions,
        getInheritedPermissions,
        isAllowed,
        getActionsByType,
        registerActions
    };
}
exports.default = default_1;
