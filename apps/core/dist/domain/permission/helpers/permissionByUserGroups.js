"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(deps) {
    const { 'core.domain.permission.helpers.simplePermission': simplePermHelper = null, 'core.domain.permission.helpers.reducePermissionsArray': reducePermissionsArrayHelper } = deps;
    return {
        async getPermissionByUserGroups({ type, action, userGroupsPaths, applyTo = null, permissionTreeTarget = null, ctx }) {
            const _getRootPermission = () => simplePermHelper.getSimplePermission({
                type,
                applyTo,
                action,
                usersGroupNodeId: null,
                permissionTreeTarget,
                ctx
            });
            // Retrieve permission for each user group.
            // If user has no group, retrieve permission for root level ("all users")
            const userPerms = userGroupsPaths.length
                ? await Promise.all(userGroupsPaths.map(async (groupPath) => {
                    return groupPath.length
                        ? groupPath.slice().reduce(async (pathPermProm, pathNode) => {
                            const pathPerm = await pathPermProm;
                            const perm = await simplePermHelper.getSimplePermission({
                                type,
                                applyTo,
                                action,
                                usersGroupNodeId: pathNode.id,
                                permissionTreeTarget,
                                ctx
                            });
                            if (perm !== null) {
                                return pathPerm || perm;
                            }
                            // Nothing found in tree, check on root level
                            return _getRootPermission();
                        }, Promise.resolve(null))
                        : _getRootPermission();
                }))
                : [await _getRootPermission()];
            return reducePermissionsArrayHelper.reducePermissionsArray(userPerms);
        }
    };
}
exports.default = default_1;
