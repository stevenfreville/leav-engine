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
function default_1({ 'core.domain.actionsList': actionsListDomain = null } = {}) {
    return {
        id: 'validateRegex',
        name: 'Validate Regex',
        description: 'Check if value is a string matching given regex',
        input_types: [actionsList_1.ActionsListIOTypes.STRING],
        output_types: [actionsList_1.ActionsListIOTypes.STRING],
        params: [{ name: 'regex', type: 'string', description: 'Validation regex', required: true, default_value: '' }],
        action: (value, params, ctx) => {
            let schema = joi_1.default.string();
            if (params.regex) {
                schema = schema.regex(new RegExp(params.regex));
            }
            const validationRes = schema.validate(value);
            if (!!validationRes.error) {
                throw new ValidationError_1.default(actionsListDomain.handleJoiError(ctx.attribute, validationRes.error));
            }
            return value;
        }
    };
}
exports.default = default_1;
