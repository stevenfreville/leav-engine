"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const permissions_1 = require("../../_types/permissions");
function default_1({ 'core.domain.permission.helpers.globalPermission': globalPermHelper = null } = {}) {
    const getAdminPermission = async ({ action, userId, ctx }) => {
        return globalPermHelper.getGlobalPermission({
            type: permissions_1.PermissionTypes.ADMIN,
            action,
            userId
        }, ctx);
    };
    const getInheritedAdminPermission = async ({ action, userGroupId, ctx }) => {
        return globalPermHelper.getInheritedGlobalPermission({
            type: permissions_1.PermissionTypes.ADMIN,
            action,
            userGroupNodeId: userGroupId
        }, ctx);
    };
    return {
        getAdminPermission,
        getInheritedAdminPermission
    };
}
exports.default = default_1;
