"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const joi_1 = __importDefault(require("joi"));
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const actionsList_1 = require("../../_types/actionsList");
const errors_1 = require("../../_types/errors");
function default_1() {
    const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return {
        id: 'validateEmail',
        name: 'Validate email',
        description: 'Check if value is a string matching email format',
        input_types: [actionsList_1.ActionsListIOTypes.STRING],
        output_types: [actionsList_1.ActionsListIOTypes.STRING],
        action: (value, params, ctx) => {
            const schema = joi_1.default.string().regex(EMAIL_REGEX);
            const validationRes = schema.validate(value);
            if (!!validationRes.error) {
                throw new ValidationError_1.default({ [ctx.attribute.id]: errors_1.Errors.INVALID_EMAIL });
            }
            return value;
        }
    };
}
exports.default = default_1;
