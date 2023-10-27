"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const actionsList_1 = require("../../_types/actionsList");
const errors_1 = require("../../_types/errors");
function default_1() {
    return {
        id: 'validateURL',
        name: 'Validate URL',
        description: 'Check if value is a string matching URL format',
        input_types: [actionsList_1.ActionsListIOTypes.STRING],
        output_types: [actionsList_1.ActionsListIOTypes.STRING],
        action: (value, params, ctx) => {
            try {
                new URL(value);
            }
            catch (err) {
                throw new ValidationError_1.default({ [ctx.attribute.id]: errors_1.Errors.INVALID_URL });
            }
            return value;
        }
    };
}
exports.default = default_1;
