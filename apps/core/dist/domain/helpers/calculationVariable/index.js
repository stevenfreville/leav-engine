"use strict";
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationError_1 = __importDefault(require("../../../errors/ValidationError"));
const errors_1 = require("../../../_types/errors");
function default_1({ 'core.domain.helpers.calculationsVariableFunctions': variableFunctions = null } = {}) {
    const processVariableString = async (context, variableString, initialValue) => {
        let passingValue = [
            {
                recordId: context.recordId,
                library: context.library,
                value: initialValue
            }
        ];
        const functionsStrings = variableString.split('.').filter(fStr => fStr.length);
        for (const funcString of functionsStrings) {
            const openeningParenthesisPos = funcString.indexOf('(');
            const closingParenthesisPos = funcString.indexOf(')');
            const funcName = funcString.substring(0, openeningParenthesisPos);
            const paramsStr = funcString.substring(openeningParenthesisPos + 1, closingParenthesisPos);
            if (variableFunctions[funcName]) {
                passingValue = await variableFunctions[funcName].run(context, passingValue, paramsStr);
            }
            else {
                throw new ValidationError_1.default({
                    target: {
                        msg: errors_1.Errors.INVALID_VARIABLE_FUNCTION,
                        vars: { functionName: funcName }
                    }
                });
            }
        }
        return passingValue;
    };
    return {
        processVariableString
    };
}
exports.default = default_1;
