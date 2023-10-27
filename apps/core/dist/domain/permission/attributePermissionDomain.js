"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const permissions_1 = require("../../_types/permissions");
function default_1(deps = {}) {
    const { 'core.domain.permission.helpers.globalPermission': globalPermHelper = null } = deps;
    const getAttributePermission = async ({ action, attributeId, ctx }) => {
        return globalPermHelper.getGlobalPermission({
            type: permissions_1.PermissionTypes.ATTRIBUTE,
            action,
            applyTo: attributeId,
            userId: ctx.userId
        }, ctx);
    };
    const getInheritedAttributePermission = async ({ action, attributeId, userGroupId, ctx }) => {
        return globalPermHelper.getInheritedGlobalPermission({
            type: permissions_1.PermissionTypes.ATTRIBUTE,
            action,
            applyTo: attributeId,
            userGroupNodeId: userGroupId
        }, ctx);
    };
    return {
        getAttributePermission,
        getInheritedAttributePermission
    };
}
exports.default = default_1;
