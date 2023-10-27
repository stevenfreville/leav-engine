"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const permissions_1 = require("../../_types/permissions");
function default_1({ 'core.domain.permission.helpers.globalPermission': globalPermHelper = null } = {}) {
    const getTreeLibraryPermission = async ({ action, treeId, libraryId, userId, getDefaultPermission, ctx }) => {
        return globalPermHelper.getGlobalPermission({
            type: permissions_1.PermissionTypes.TREE_LIBRARY,
            action,
            applyTo: `${treeId}/${libraryId}`,
            userId,
            getDefaultPermission
        }, ctx);
    };
    const getInheritedTreeLibraryPermission = async ({ action, treeId, libraryId, userGroupId, getDefaultPermission, ctx }) => {
        return globalPermHelper.getInheritedGlobalPermission({
            type: permissions_1.PermissionTypes.TREE_LIBRARY,
            action,
            applyTo: `${treeId}/${libraryId}`,
            userGroupNodeId: userGroupId,
            getDefaultPermission
        }, ctx);
    };
    return {
        getTreeLibraryPermission,
        getInheritedTreeLibraryPermission
    };
}
exports.default = default_1;
