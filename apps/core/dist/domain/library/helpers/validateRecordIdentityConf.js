"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../../_types/errors");
exports.default = async (libData, libAttributes, deps, ctx) => {
    const errors = {};
    if (!libData.recordIdentityConf) {
        return {};
    }
    const allowedAttributes = libAttributes.length
        ? libAttributes
        : (await deps.attributeDomain.getLibraryAttributes(libData.id, ctx)).map(a => a.id);
    const unbindedAttrs = [];
    for (const identitiyField of Object.keys(libData.recordIdentityConf)) {
        const attrId = libData.recordIdentityConf[identitiyField];
        if (!attrId) {
            libData.recordIdentityConf[identitiyField] = null;
            continue;
        }
        if (allowedAttributes.indexOf(attrId) === -1) {
            unbindedAttrs.push(attrId);
        }
    }
    if (unbindedAttrs.length) {
        errors.recordIdentityConf = { msg: errors_1.Errors.UNBINDED_ATTRIBUTES, vars: { attributes: unbindedAttrs.join(', ') } };
    }
    return errors;
};
