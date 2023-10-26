"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_CONSULTATION_HISTORY_SIZE = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const utils_1 = require("@leav/utils");
const PermissionError_1 = __importDefault(require("../../errors/PermissionError"));
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const application_1 = require("../../_types/application");
const errors_1 = require("../../_types/errors");
const eventsManager_1 = require("../../_types/eventsManager");
const list_1 = require("../../_types/list");
const permissions_1 = require("../../_types/permissions");
exports.MAX_CONSULTATION_HISTORY_SIZE = 10;
function default_1({ 'core.domain.permission.admin': adminPermissionDomain = null, 'core.domain.user': userDomain = null, 'core.domain.eventsManager': eventsManagerDomain = null, 'core.infra.application': applicationRepo = null, 'core.utils': utils = null, translator = null, config = null } = {}) {
    const _getApplicationProperties = async ({ id, ctx }) => {
        const apps = await applicationRepo.getApplications({
            params: { filters: { id }, strictFilters: true },
            ctx
        });
        if (!apps.list.length) {
            throw new ValidationError_1.default({
                id: { msg: errors_1.Errors.UNKNOWN_APPLICATION, vars: { application: id } }
            });
        }
        const props = apps.list.pop();
        return props;
    };
    const _sendAppEvent = async (params, ctx) => {
        const { application, type } = params;
        return eventsManagerDomain.sendPubSubEvent({
            data: {
                applicationEvent: {
                    type,
                    application
                }
            },
            triggerName: eventsManager_1.TriggerNames.APPLICATION_EVENT
        }, ctx);
    };
    return {
        async getApplicationProperties(params) {
            return _getApplicationProperties(params);
        },
        async getApplications({ params, ctx }) {
            const initializedParams = Object.assign({}, params);
            if (typeof initializedParams.sort === 'undefined') {
                initializedParams.sort = { field: 'id', order: list_1.SortOrder.ASC };
            }
            return applicationRepo.getApplications({ params: initializedParams, ctx });
        },
        async saveApplication({ applicationData, ctx }) {
            var _a;
            // Check if application exists
            const apps = await applicationRepo.getApplications({
                params: { filters: { id: applicationData.id }, strictFilters: true },
                ctx
            });
            const isExistingApp = apps.list.length;
            const defaultParams = {
                id: '',
                system: false,
                type: application_1.ApplicationTypes.INTERNAL
            };
            const appProps = (_a = apps.list[0]) !== null && _a !== void 0 ? _a : null;
            const appToSave = isExistingApp
                ? Object.assign(Object.assign(Object.assign({}, defaultParams), appProps), applicationData) : Object.assign(Object.assign({}, defaultParams), applicationData);
            const isExternalApp = appToSave.type === application_1.ApplicationTypes.EXTERNAL;
            const errors = {};
            const permissionToCheck = isExistingApp
                ? permissions_1.AdminPermissionsActions.EDIT_APPLICATION
                : permissions_1.AdminPermissionsActions.CREATE_APPLICATION;
            const canSave = await adminPermissionDomain.getAdminPermission({
                action: permissionToCheck,
                userId: ctx.userId,
                ctx
            });
            if (!canSave) {
                throw new PermissionError_1.default(permissionToCheck);
            }
            if (!isExistingApp && !utils.isIdValid(appToSave.id)) {
                errors.id = errors_1.Errors.INVALID_ID_FORMAT;
            }
            if (!utils.isEndpointValid(appToSave.endpoint, isExternalApp)) {
                errors.endpoint = errors_1.Errors.INVALID_ENDPOINT_FORMAT;
            }
            if (Object.keys(errors).length) {
                throw new ValidationError_1.default(errors);
            }
            // If doesn't exist, we create it. Otherwise, update it
            const savedApp = await (isExistingApp
                ? applicationRepo.updateApplication({ applicationData: appToSave, ctx })
                : applicationRepo.createApplication({ applicationData: appToSave, ctx }));
            await _sendAppEvent({
                application: savedApp,
                type: application_1.ApplicationEventTypes.SAVE
            }, ctx);
            return savedApp;
        },
        async deleteApplication({ id, ctx }) {
            const apps = await applicationRepo.getApplications({
                params: { filters: { id }, strictFilters: true },
                ctx
            });
            const canDelete = await adminPermissionDomain.getAdminPermission({
                action: permissions_1.AdminPermissionsActions.DELETE_APPLICATION,
                userId: ctx.userId,
                ctx
            });
            if (!canDelete) {
                throw new PermissionError_1.default(permissions_1.AdminPermissionsActions.DELETE_APPLICATION);
            }
            if (!apps.list.length) {
                throw new ValidationError_1.default({ id: { msg: errors_1.Errors.UNKNOWN_APPLICATION, vars: { application: id } } });
            }
            const deletedApp = await applicationRepo.deleteApplication({ id, ctx });
            await _sendAppEvent({
                application: deletedApp,
                type: application_1.ApplicationEventTypes.DELETE
            }, ctx);
            return deletedApp;
        },
        async updateConsultationHistory({ applicationId, ctx }) {
            var _a;
            // Retrieve user data
            const consultedApps = await userDomain.getUserData([utils_1.CONSULTED_APPS_KEY], false, ctx);
            // Compute new history:
            // - Add last consulted app to the beginning of the list
            // - Use a Set to deduplicate array
            // - Limit size to MAX_CONSULTATION_HISTORY_SIZE
            const newHistory = [...new Set([applicationId, ...((_a = consultedApps.data[utils_1.CONSULTED_APPS_KEY]) !== null && _a !== void 0 ? _a : [])])].slice(0, exports.MAX_CONSULTATION_HISTORY_SIZE);
            // Save new history
            await userDomain.saveUserData({
                key: utils_1.CONSULTED_APPS_KEY,
                value: newHistory,
                global: false,
                isCoreData: true,
                ctx
            });
        },
        async getAvailableModules({ ctx }) {
            return applicationRepo.getAvailableModules({ ctx });
        },
        getApplicationUrl({ application }) {
            if (application.type === application_1.ApplicationTypes.INTERNAL) {
                return `${config.server.publicUrl}/${utils.getFullApplicationEndpoint(application.endpoint)}/`;
            }
            // External application: make sure URL starts with http or https
            const url = application.endpoint.match(/^http(s)?:\/\//i)
                ? application.endpoint
                : `http://${application.endpoint}`;
            return url;
        }
    };
}
exports.default = default_1;
