"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PermissionError_1 = __importDefault(require("../../errors/PermissionError"));
const cacheService_1 = require("../../infra/cache/cacheService");
const errors_1 = require("../../_types/errors");
const list_1 = require("../../_types/list");
const permissions_1 = require("../../_types/permissions");
function default_1({ 'core.domain.permission.admin': adminPermissionDomain, 'core.domain.helpers.getCoreEntityById': getCoreEntityById, 'core.infra.versionProfile': versionProfileRepo = null, 'core.infra.tree': treeRepo = null, 'core.infra.attribute': attributeRepo = null, 'core.infra.cache.cacheService': cacheService = null, 'core.utils': utils = null }) {
    return {
        async getVersionProfiles({ params, ctx }) {
            const initializedParams = Object.assign({}, params);
            if (typeof initializedParams.sort === 'undefined') {
                initializedParams.sort = { field: 'id', order: list_1.SortOrder.ASC };
            }
            return versionProfileRepo.getVersionProfiles({ params: initializedParams, ctx });
        },
        async getVersionProfileProperties({ id, ctx }) {
            const profile = await getCoreEntityById('versionProfile', id, ctx);
            if (!profile) {
                throw utils.generateExplicitValidationError('id', { msg: errors_1.Errors.UNKNOWN_VERSION_PROFILE, vars: { profile: id } }, ctx.lang);
            }
            return profile;
        },
        async saveVersionProfile({ versionProfile, ctx }) {
            const existingVersionProfile = await versionProfileRepo.getVersionProfiles({
                params: { filters: { id: versionProfile.id } },
                ctx
            });
            const isNewProfile = !existingVersionProfile.list.length;
            const actionToCheck = isNewProfile
                ? permissions_1.AdminPermissionsActions.CREATE_VERSION_PROFILE
                : permissions_1.AdminPermissionsActions.EDIT_VERSION_PROFILE;
            const canSave = await adminPermissionDomain.getAdminPermission({
                action: actionToCheck,
                userId: ctx.userId,
                ctx
            });
            if (!canSave) {
                throw new PermissionError_1.default(actionToCheck);
            }
            if (!utils.isIdValid(versionProfile.id)) {
                throw utils.generateExplicitValidationError('id', errors_1.Errors.INVALID_ID_FORMAT, ctx.lang);
            }
            const defaultParams = {
                _key: '',
                label: null,
                description: null,
                trees: []
            };
            const profileToSave = isNewProfile
                ? Object.assign(Object.assign({}, defaultParams), versionProfile) : Object.assign(Object.assign(Object.assign({}, defaultParams), existingVersionProfile.list[0]), versionProfile);
            // Check all trees exist
            const existingTrees = await treeRepo.getTrees({ ctx });
            const unknownTrees = profileToSave.trees.filter(tree => !existingTrees.list.find(t => t.id === tree));
            if (unknownTrees.length) {
                throw utils.generateExplicitValidationError('trees', { msg: errors_1.Errors.UNKNOWN_TREES, vars: { trees: unknownTrees.join(', ') } }, ctx.lang);
            }
            const savedProfile = isNewProfile
                ? await versionProfileRepo.createVersionProfile({ profileData: profileToSave, ctx })
                : await versionProfileRepo.updateVersionProfile({ profileData: profileToSave, ctx });
            if (!isNewProfile) {
                const cacheKey = utils.getCoreEntityCacheKey('versionProfile', savedProfile.id);
                await cacheService.getCache(cacheService_1.ECacheType.RAM).deleteData([cacheKey, `${cacheKey}:*`]);
            }
            return savedProfile;
        },
        async deleteVersionProfile({ id, ctx }) {
            const existingVersionProfile = await versionProfileRepo.getVersionProfiles({
                params: { filters: { id } },
                ctx
            });
            if (!existingVersionProfile.list.length) {
                throw utils.generateExplicitValidationError('id', { msg: errors_1.Errors.UNKNOWN_VERSION_PROFILE, vars: { profile: id } }, ctx.lang);
            }
            const actionToCheck = permissions_1.AdminPermissionsActions.DELETE_VERSION_PROFILE;
            const canDelete = await adminPermissionDomain.getAdminPermission({
                action: actionToCheck,
                userId: ctx.userId,
                ctx
            });
            if (!canDelete) {
                throw new PermissionError_1.default(actionToCheck);
            }
            // Remove profile from attributes using it
            const attributesUsingProfile = await this.getAttributesUsingProfile({ id, ctx });
            if (attributesUsingProfile.length) {
                await Promise.all(attributesUsingProfile.map(attribute => {
                    return attributeRepo.updateAttribute({
                        attrData: Object.assign(Object.assign({}, attribute), { multiple_values: attribute.multiple_values, versions_conf: Object.assign(Object.assign({}, attribute.versions_conf), { profile: null }) }),
                        ctx
                    });
                }));
            }
            return versionProfileRepo.deleteVersionProfile({ id, ctx });
        },
        async getAttributesUsingProfile({ id, ctx }) {
            return versionProfileRepo.getAttributesUsingProfile({ id, ctx });
        }
    };
}
exports.default = default_1;
