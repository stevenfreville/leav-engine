"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const permissions_1 = require("../../../_types/permissions");
exports.default = async (existingLib, userId, deps, ctx) => {
    const action = existingLib ? permissions_1.AdminPermissionsActions.EDIT_LIBRARY : permissions_1.AdminPermissionsActions.CREATE_LIBRARY;
    const canSaveLibrary = await deps.adminPermissionDomain.getAdminPermission({ action, userId, ctx });
    if (!canSaveLibrary) {
        return { canSave: false, action };
    }
    return { canSave: true, action };
};
