"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1({ config = null, 'core.domain.globalSettings': globalSettingsDomain = null, 'core.infra.mailer': mailer = null } = {}) {
    return {
        mailer,
        async sendEmail({ to, subject, text, html, attachments }, ctx) {
            const globalSettings = await globalSettingsDomain.getSettings(ctx);
            await mailer.sendMail({
                from: `${globalSettings.name} <${config.mailer.auth.user}>`,
                to,
                subject,
                text,
                html,
                attachments: attachments
            });
        }
    };
}
exports.default = default_1;
