"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCoreDataKeys = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const promises_1 = require("fs/promises");
const handlebars_1 = __importDefault(require("handlebars"));
const errors_1 = require("../../_types/errors");
const PermissionError_1 = __importDefault(require("../../errors/PermissionError"));
const permissions_1 = require("../../_types/permissions");
var UserCoreDataKeys;
(function (UserCoreDataKeys) {
    UserCoreDataKeys["CONSULTED_APPS"] = "applications_consultation";
})(UserCoreDataKeys = exports.UserCoreDataKeys || (exports.UserCoreDataKeys = {}));
function default_1({ config = null, 'core.infra.userData': userDataRepo = null, 'core.domain.permission': permissionDomain = null, 'core.infra.mailer.mailerService': mailerService = null, 'core.domain.globalSettings': globalSettingsDomain = null, 'core.utils': utils = null, translator = null } = {}) {
    return {
        async sendResetPasswordEmail(email, token, login, browser, os, lang, // FIXME: temporary
        ctx) {
            const html = await (0, promises_1.readFile)(__dirname + `/resetPassword_${lang}.html`, { encoding: 'utf-8' });
            const template = handlebars_1.default.compile(html);
            const loginAppEndpoint = utils.getFullApplicationEndpoint('login');
            const globalSettings = await globalSettingsDomain.getSettings(ctx);
            const htmlWithData = template({
                login,
                resetPasswordUrl: `${config.server.publicUrl}/${loginAppEndpoint}/reset-password/${token}`,
                supportEmail: config.server.supportEmail,
                browser,
                appName: globalSettings.name
            });
            await mailerService.sendEmail({
                to: email,
                subject: translator.t('mailer.reset_password_subject', { lng: lang }),
                html: htmlWithData
            }, ctx);
        },
        async saveUserData({ key, value, global, isCoreData = false, ctx }) {
            if (!isCoreData && Object.values(UserCoreDataKeys).includes(key)) {
                throw new ValidationError_1.default({ key: errors_1.Errors.FORBIDDEN_KEY });
            }
            if (global &&
                !(await permissionDomain.isAllowed({
                    type: permissions_1.PermissionTypes.ADMIN,
                    action: permissions_1.AdminPermissionsActions.MANAGE_GLOBAL_PREFERENCES,
                    userId: ctx.userId,
                    ctx
                }))) {
                throw new PermissionError_1.default(permissions_1.AdminPermissionsActions.MANAGE_GLOBAL_PREFERENCES);
            }
            return userDataRepo.saveUserData({ key, value, global, isCoreData, ctx });
        },
        async getUserData(keys, global = false, ctx) {
            const isAllowed = await permissionDomain.isAllowed({
                type: permissions_1.PermissionTypes.ADMIN,
                action: permissions_1.AdminPermissionsActions.MANAGE_GLOBAL_PREFERENCES,
                userId: ctx.userId,
                ctx
            });
            if (global && !isAllowed) {
                throw new PermissionError_1.default(permissions_1.AdminPermissionsActions.MANAGE_GLOBAL_PREFERENCES);
            }
            const res = await userDataRepo.getUserData(keys, global, ctx);
            if (isAllowed && !global) {
                for (const k of keys) {
                    if (typeof res.data[k] === 'undefined') {
                        const globalData = (await userDataRepo.getUserData([k], true, ctx)).data;
                        res.data[k] = globalData ? globalData[k] : null;
                    }
                }
            }
            return res;
        }
    };
}
exports.default = default_1;
