"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const errors_1 = require("../../_types/errors");
function default_1({ 'core.domain.helpers.validate': validationHelper = null, 'core.domain.user': userDomain = null, 'core.domain.tree': treeDomain = null, 'core.infra.view': viewRepo = null, 'core.utils': utils = null }) {
    return {
        async saveView(view, ctx) {
            const isExistingView = !!view.id;
            await validationHelper.validateLibrary(view.library, ctx);
            // Check user is owner
            if (isExistingView) {
                const existingView = await viewRepo.getViews({
                    filters: { id: view.id },
                    strictFilters: true
                }, ctx);
                if (!existingView.list.length) {
                    throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_VIEW });
                }
                const existingViewData = existingView.list[0];
                if (existingViewData.created_by !== ctx.userId) {
                    throw new ValidationError_1.default({ id: errors_1.Errors.USER_IS_NOT_VIEW_OWNER });
                }
            }
            // Validate values versions settings
            if (view.valuesVersions) {
                // Check version settings are valid: treeId is part of the profile and tree node exist
                for (const treeId of Object.keys(view.valuesVersions)) {
                    await validationHelper.validateTree(treeId, true, ctx);
                    const isNodePresent = await treeDomain.isNodePresent({
                        treeId,
                        nodeId: view.valuesVersions[treeId],
                        ctx
                    });
                    if (!isNodePresent) {
                        throw utils.generateExplicitValidationError('version', {
                            msg: errors_1.Errors.INVALID_VALUES_VERSIONS_SETTINGS_BAD_NODE_ID,
                            vars: { treeId, nodeId: view.valuesVersions[treeId] }
                        }, ctx.lang);
                    }
                }
            }
            const now = (0, moment_1.default)().unix();
            const viewToSave = Object.assign(Object.assign({}, view), { modified_at: now });
            if (isExistingView) {
                return viewRepo.updateView(viewToSave, ctx);
            }
            viewToSave.created_at = now;
            viewToSave.created_by = ctx.userId;
            return viewRepo.createView(viewToSave, ctx);
        },
        async getViews(library, ctx) {
            await validationHelper.validateLibrary(library, ctx);
            const filters = {
                library,
                created_by: ctx.userId
            };
            const views = await viewRepo.getViews({
                filters,
                withCount: true
            }, ctx);
            return views;
        },
        async getViewById(viewId, ctx) {
            const filters = {
                id: viewId
            };
            const views = await viewRepo.getViews({
                filters,
                strictFilters: true,
                withCount: false
            }, ctx);
            if (!views.list.length) {
                throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_VIEW });
            }
            return views.list[0];
        },
        async deleteView(viewId, ctx) {
            // Check view exists
            const existingView = await viewRepo.getViews({
                filters: { id: viewId },
                strictFilters: true
            }, ctx);
            if (!existingView.list.length) {
                throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_VIEW });
            }
            // Check user is owner
            const existingViewData = existingView.list[0];
            if (existingViewData.created_by !== ctx.userId) {
                throw new ValidationError_1.default({ id: errors_1.Errors.USER_IS_NOT_VIEW_OWNER });
            }
            return viewRepo.deleteView(viewId, ctx);
        }
    };
}
exports.default = default_1;
