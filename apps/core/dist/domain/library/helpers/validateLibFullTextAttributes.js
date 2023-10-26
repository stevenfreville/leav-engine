"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../../_types/errors");
const lodash_1 = require("lodash");
exports.default = (attributes, fullTextAttributes) => {
    const errors = {};
    if ((0, lodash_1.difference)(fullTextAttributes, attributes).length) {
        errors.fullTextAttributes = {
            msg: errors_1.Errors.INVALID_FULLTEXT_ATTRIBUTES,
            vars: { fullTextAttributes: fullTextAttributes.join(', ') }
        };
    }
    return errors;
};
