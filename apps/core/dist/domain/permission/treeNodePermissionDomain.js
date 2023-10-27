"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const errors_1 = require("../../_types/errors");
const permissions_1 = require("../../_types/permissions");
function default_1(deps = {}) {
    const { 'core.domain.permission.tree': treePermissionDomain = null, 'core.domain.permission.treeLibrary': treeLibraryPermissionDomain = null, 'core.domain.permission.helpers.treeBasedPermissions': treeBasedPermissionsHelper = null, 'core.domain.permission.helpers.permissionByUserGroups': permByUserGroupHelper = null, 'core.domain.permission.helpers.defaultPermission': defaultPermHelper = null, 'core.domain.helpers.getCoreEntityById': getCoreEntityById = null, 'core.infra.tree': treeRepo = null, 'core.domain.attribute': attributeDomain = null, 'core.infra.value': valueRepo = null } = deps;
    const _getPermByTreeNode = async (params) => {
        const { action, userId, treeId, permConf, treeElement, ctx } = params;
        const { id: recordId, library } = treeElement;
        if (!(permConf === null || permConf === void 0 ? void 0 : permConf[library])) {
            return treeLibraryPermissionDomain.getTreeLibraryPermission({
                action,
                treeId,
                libraryId: library,
                userId,
                ctx,
                getDefaultPermission: () => null
            });
        }
        // Get tree attributes values
        const treesAttrValues = await Promise.all(permConf[library].permissionTreeAttributes.map(async (permTreeAttr) => {
            const permTreeAttrProps = await attributeDomain.getAttributeProperties({ id: permTreeAttr, ctx });
            return valueRepo.getValues({
                library,
                recordId,
                attribute: permTreeAttrProps,
                ctx
            });
        }));
        const valuesByAttr = treesAttrValues.reduce((allVal, treeVal, i) => {
            allVal[permConf[library].permissionTreeAttributes[i]] = treeVal.map(v => v.value.id);
            return allVal;
        }, {});
        // Get permission
        const nodePerm = await treeBasedPermissionsHelper.getTreeBasedPermission({
            type: permissions_1.PermissionTypes.TREE_NODE,
            action,
            userId,
            applyTo: `${treeId}/${library}`,
            treeValues: valuesByAttr,
            permissions_conf: permConf[library],
            getDefaultPermission: () => null
        }, ctx);
        if (nodePerm !== null) {
            return nodePerm;
        }
        // Element has no permission defined, look for tree library permission
        return treeLibraryPermissionDomain.getTreeLibraryPermission({
            action,
            treeId,
            libraryId: library,
            userId,
            ctx,
            getDefaultPermission: () => null
        });
    };
    return {
        async getTreeNodePermission({ action, userId, nodeId, treeId, ctx }) {
            // Retrieve permissions conf for this node library
            // Call repo instead of domain to avoid some cyclic reference issues
            const nodeRecord = await treeRepo.getRecordByNodeId({ treeId, nodeId, ctx });
            if (!nodeRecord) {
                return treePermissionDomain.getTreePermission({
                    action: action,
                    userId,
                    treeId,
                    ctx
                });
            }
            const nodeElement = { id: nodeRecord.id, library: nodeRecord.library };
            const treeData = await getCoreEntityById('tree', treeId, ctx);
            if (!treeData) {
                throw new ValidationError_1.default({
                    id: errors_1.Errors.UNKNOWN_TREE
                });
            }
            // Retrieve permissions for this element, based on tree permissions conf
            const elemPerm = await _getPermByTreeNode({
                action: action,
                userId,
                treeId,
                permConf: treeData.permissions_conf,
                treeElement: nodeElement,
                ctx
            });
            if (elemPerm !== null) {
                return elemPerm;
            }
            // Element has no permission defined. We check on its ancestors and return the first we find.
            // If we find nothing, we'll return global tree permission.
            const ancestors = await treeRepo.getElementAncestors({
                treeId,
                nodeId,
                ctx
            });
            for (const parent of ancestors) {
                const parentNode = {
                    id: parent.record.id,
                    library: parent.record.library
                };
                const parentPerm = await _getPermByTreeNode({
                    action,
                    userId,
                    treeId,
                    permConf: treeData.permissions_conf,
                    treeElement: parentNode,
                    ctx
                });
                if (parentPerm !== null) {
                    return parentPerm;
                }
            }
            // Nothing found on all ancestors
            return treePermissionDomain.getTreePermission({
                action: action,
                userId,
                treeId,
                ctx
            });
        },
        async getInheritedTreeNodePermission({ action, userGroupId, treeId, libraryId, permTree, permTreeNode, ctx }) {
            const _getDefaultPermission = async (params) => {
                const { userGroups } = params;
                // Check tree library permission
                const treeLibPerm = await permByUserGroupHelper.getPermissionByUserGroups({
                    type: permissions_1.PermissionTypes.TREE_LIBRARY,
                    action,
                    userGroupsPaths: userGroups,
                    applyTo: `${treeId}/${libraryId}`,
                    ctx
                });
                if (treeLibPerm !== null) {
                    return treeLibPerm;
                }
                const treePerm = await permByUserGroupHelper.getPermissionByUserGroups({
                    type: permissions_1.PermissionTypes.TREE,
                    action,
                    userGroupsPaths: userGroups,
                    applyTo: treeId,
                    ctx
                });
                return treePerm !== null ? treePerm : defaultPermHelper.getDefaultPermission();
            };
            return treeBasedPermissionsHelper.getInheritedTreeBasedPermission({
                type: permissions_1.PermissionTypes.TREE_NODE,
                applyTo: `${treeId}/${libraryId}`,
                action,
                userGroupId,
                permissionTreeTarget: { tree: permTree, nodeId: permTreeNode },
                getDefaultPermission: _getDefaultPermission
            }, ctx);
        }
    };
}
exports.default = default_1;
