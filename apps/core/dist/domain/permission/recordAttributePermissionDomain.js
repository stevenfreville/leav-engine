"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const permissions_1 = require("../../_types/permissions");
function default_1(deps = {}) {
    const { 'core.domain.permission.attribute': attrPermissionDomain = null, 'core.domain.permission.helpers.treeBasedPermissions': treeBasedPermissionsHelper = null, 'core.domain.permission.helpers.permissionByUserGroups': permByUserGroupsHelper = null, 'core.domain.permission.helpers.defaultPermission': defaultPermHelper = null, 'core.domain.attribute': attributeDomain = null, 'core.infra.value': valueRepo = null } = deps;
    return {
        async getRecordAttributePermission(action, userId, attributeId, recordLibrary, recordId, ctx) {
            const attrProps = await attributeDomain.getAttributeProperties({ id: attributeId, ctx });
            if (typeof attrProps.permissions_conf === 'undefined') {
                // Check if action is present in library permissions
                const isAttrAction = Object.values(permissions_1.AttributePermissionsActions).indexOf(action) !== -1;
                return isAttrAction
                    ? attrPermissionDomain.getAttributePermission({
                        action: action,
                        attributeId,
                        ctx
                    })
                    : defaultPermHelper.getDefaultPermission();
            }
            const treesAttrValues = await Promise.all(attrProps.permissions_conf.permissionTreeAttributes.map(async (permTreeAttr) => {
                const permTreeAttrProps = await attributeDomain.getAttributeProperties({ id: permTreeAttr, ctx });
                return valueRepo.getValues({
                    library: recordLibrary,
                    recordId,
                    attribute: permTreeAttrProps,
                    ctx
                });
            }));
            const valuesByAttr = treesAttrValues.reduce((allVal, treeVal, i) => {
                allVal[attrProps.permissions_conf.permissionTreeAttributes[i]] = treeVal.map(v => v.value.id);
                return allVal;
            }, {});
            const perm = treeBasedPermissionsHelper.getTreeBasedPermission({
                type: permissions_1.PermissionTypes.RECORD_ATTRIBUTE,
                action,
                userId,
                applyTo: attributeId,
                treeValues: valuesByAttr,
                permissions_conf: attrProps.permissions_conf,
                getDefaultPermission: () => attrPermissionDomain.getAttributePermission({
                    action: action,
                    attributeId,
                    ctx
                })
            }, ctx);
            return perm;
        },
        async getInheritedRecordAttributePermission({ action, attributeId, userGroupId, permTree, permTreeNode }, ctx) {
            const _getDefaultPermission = async (params) => {
                const { applyTo, userGroups } = params;
                const libPerm = await permByUserGroupsHelper.getPermissionByUserGroups({
                    type: permissions_1.PermissionTypes.ATTRIBUTE,
                    action,
                    userGroupsPaths: userGroups,
                    applyTo,
                    ctx
                });
                return libPerm !== null ? libPerm : defaultPermHelper.getDefaultPermission();
            };
            return treeBasedPermissionsHelper.getInheritedTreeBasedPermission({
                type: permissions_1.PermissionTypes.RECORD_ATTRIBUTE,
                applyTo: attributeId,
                action,
                userGroupId,
                permissionTreeTarget: { tree: permTree, nodeId: permTreeNode },
                getDefaultPermission: _getDefaultPermission
            }, ctx);
        }
    };
}
exports.default = default_1;
