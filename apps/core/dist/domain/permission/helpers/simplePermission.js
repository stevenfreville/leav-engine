"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1({ 'core.domain.permission.helpers.permissionsByActions': permsByActionsHelper = null }) {
    return {
        async getSimplePermission({ type, applyTo, action, usersGroupNodeId, permissionTreeTarget = null, ctx }) {
            var _a;
            const perms = await permsByActionsHelper.getPermissionsByActions({
                type,
                applyTo,
                actions: [action],
                usersGroupNodeId,
                permissionTreeTarget,
                ctx
            });
            return (_a = perms[action]) !== null && _a !== void 0 ? _a : null;
        }
    };
}
exports.default = default_1;
