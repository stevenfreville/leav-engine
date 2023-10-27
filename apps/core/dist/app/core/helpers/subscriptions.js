"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1() {
    const commonSubscriptionsFilters = `
        ignoreOwnEvents: Boolean
    `;
    return {
        commonSubscriptionsFilters,
        isOwnEvent: (event, ctx) => {
            return event.userId === ctx.userId;
        }
    };
}
exports.default = default_1;
