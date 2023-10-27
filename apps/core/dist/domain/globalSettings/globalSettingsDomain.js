"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PermissionError_1 = __importDefault(require("../../errors/PermissionError"));
const permissions_1 = require("../../_types/permissions");
function default_1({ 'core.domain.permission.admin': adminPermissionDomain = null, 'core.infra.globalSettings': globalSettingsRepo = null } = {}) {
    return {
        async saveSettings({ settings, ctx }) {
            const canSave = await adminPermissionDomain.getAdminPermission({
                action: permissions_1.AdminPermissionsActions.EDIT_GLOBAL_SETTINGS,
                userId: ctx.userId,
                ctx
            });
            if (!canSave) {
                throw new PermissionError_1.default(permissions_1.AdminPermissionsActions.EDIT_GLOBAL_SETTINGS);
            }
            // Save settings
            return globalSettingsRepo.saveSettings({ settings, ctx });
        },
        async getSettings(ctx) {
            const settings = await globalSettingsRepo.getSettings(ctx);
            return {
                name: settings.name,
                icon: settings.icon
            };
        }
    };
}
exports.default = default_1;
