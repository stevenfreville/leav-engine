"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1({ 'core.infra.permission': permissionRepo = null }) {
    return {
        async getPermissionsByActions({ type, applyTo, actions, usersGroupNodeId, permissionTreeTarget, ctx }) {
            const perms = await permissionRepo.getPermissions({
                type,
                applyTo,
                usersGroupNodeId,
                permissionTreeTarget,
                ctx
            });
            return actions.reduce((actionsPerms, action) => {
                var _a, _b;
                actionsPerms[action] = (_b = (_a = perms === null || perms === void 0 ? void 0 : perms.actions) === null || _a === void 0 ? void 0 : _a[action]) !== null && _b !== void 0 ? _b : null;
                return actionsPerms;
            }, {});
        }
    };
}
exports.default = default_1;
