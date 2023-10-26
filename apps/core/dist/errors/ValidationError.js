"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const errors_1 = require("../_types/errors");
class ValidationError extends Error {
    constructor(fields, message = 'Validation error', isCustomMessage = false, context) {
        super(message);
        this.type = errors_1.ErrorTypes.VALIDATION_ERROR;
        this.fields = fields;
        this.isCustomMessage = isCustomMessage;
        this.context = context;
    }
}
exports.default = ValidationError;
