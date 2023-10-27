"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const errors_1 = require("../../_types/errors");
const permissions_1 = require("../../_types/permissions");
function default_1(deps = {}) {
    const { 'core.domain.permission.library': libraryPermissionDomain = null, 'core.domain.permission.helpers.treeBasedPermissions': treeBasedPermissionsHelper = null, 'core.domain.permission.helpers.permissionByUserGroups': permByUserGroupHelper = null, 'core.domain.permission.helpers.defaultPermission': defaultPermHelper = null, 'core.domain.attribute': attributeDomain = null, 'core.domain.helpers.getCoreEntityById': getCoreEntityById = null, 'core.infra.value': valueRepo = null } = deps;
    return {
        async getRecordPermission({ action, userId, library, recordId, ctx }) {
            const libProps = await getCoreEntityById('library', library, ctx);
            if (!libProps) {
                throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_LIBRARY });
            }
            if (typeof libProps.permissions_conf === 'undefined') {
                // Check if action is present in library permissions
                const isLibAction = Object.values(permissions_1.LibraryPermissionsActions).indexOf(action) !== -1;
                return isLibAction
                    ? libraryPermissionDomain.getLibraryPermission({
                        action: action,
                        libraryId: library,
                        userId,
                        ctx
                    })
                    : defaultPermHelper.getDefaultPermission();
            }
            const treesAttrValues = await Promise.all(libProps.permissions_conf.permissionTreeAttributes.map(async (permTreeAttr) => {
                const permTreeAttrProps = await attributeDomain.getAttributeProperties({ id: permTreeAttr, ctx });
                return valueRepo.getValues({
                    library,
                    recordId,
                    attribute: permTreeAttrProps,
                    ctx
                });
            }));
            const valuesByAttr = treesAttrValues.reduce((allVal, treeVal, i) => {
                allVal[libProps.permissions_conf.permissionTreeAttributes[i]] = treeVal.map(v => v.value.id);
                return allVal;
            }, {});
            const perm = await treeBasedPermissionsHelper.getTreeBasedPermission({
                type: permissions_1.PermissionTypes.RECORD,
                action,
                userId,
                applyTo: library,
                treeValues: valuesByAttr,
                permissions_conf: libProps.permissions_conf,
                getDefaultPermission: params => libraryPermissionDomain.getLibraryPermission({
                    action: params.action,
                    libraryId: params.applyTo,
                    userId: params.userId,
                    ctx
                })
            }, ctx);
            return perm;
        },
        async getInheritedRecordPermission({ action, userGroupId, library: recordLibrary, permTree, permTreeNode, ctx }) {
            const _getDefaultPermission = async (params) => {
                const { applyTo, userGroups } = params;
                const libPerm = await permByUserGroupHelper.getPermissionByUserGroups({
                    type: permissions_1.PermissionTypes.LIBRARY,
                    action,
                    userGroupsPaths: userGroups,
                    applyTo,
                    ctx
                });
                return libPerm !== null ? libPerm : defaultPermHelper.getDefaultPermission();
            };
            return treeBasedPermissionsHelper.getInheritedTreeBasedPermission({
                type: permissions_1.PermissionTypes.RECORD,
                applyTo: recordLibrary,
                action,
                userGroupId,
                permissionTreeTarget: { tree: permTree, nodeId: permTreeNode },
                getDefaultPermission: _getDefaultPermission
            }, ctx);
        }
    };
}
exports.default = default_1;
