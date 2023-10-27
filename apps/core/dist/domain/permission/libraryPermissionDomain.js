"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const permissions_1 = require("../../_types/permissions");
function default_1({ 'core.domain.permission.helpers.globalPermission': globalPermHelper = null } = {}) {
    const getLibraryPermission = async ({ action, libraryId, userId, ctx }) => {
        return globalPermHelper.getGlobalPermission({
            type: permissions_1.PermissionTypes.LIBRARY,
            action,
            applyTo: libraryId,
            userId
        }, ctx);
    };
    const getInheritedLibraryPermission = async ({ action, libraryId, userGroupId, ctx }) => {
        return globalPermHelper.getInheritedGlobalPermission({
            type: permissions_1.PermissionTypes.LIBRARY,
            action,
            applyTo: libraryId,
            userGroupNodeId: userGroupId
        }, ctx);
    };
    return {
        getLibraryPermission,
        getInheritedLibraryPermission
    };
}
exports.default = default_1;
