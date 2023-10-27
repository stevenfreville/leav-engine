"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hot_formula_parser_1 = require("hot-formula-parser");
const actionsList_1 = require("../../_types/actionsList");
const errors_1 = require("../../_types/errors");
function default_1({ 'core.domain.helpers.calculationVariable': calculationVariable = null, 'core.utils': utils = null } = {}) {
    const _processReplacement = async (context, initialValue, variable) => {
        const variableValues = await calculationVariable.processVariableString(context, variable, initialValue);
        const stringValues = variableValues.map(v => {
            return v.value === null ? '' : typeof v.value === 'object' ? v.value.value : v.value;
        });
        return stringValues.join(' ');
    };
    const _replaceAsync = async (str, regex, asyncFn, context, value) => {
        if (!str) {
            return '';
        }
        const promises = [];
        str.replace(regex, (match, ...args) => {
            const promise = asyncFn(context, value, ...args);
            promises.push(promise);
            return '';
        });
        const data = await Promise.all(promises);
        //change record object to string
        const stringDatas = data.map(d => (typeof d === 'object' ? d.recordId : d));
        return str.replace(regex, () => stringDatas.shift());
    };
    const _replaceVariables = async (formula, context, value) => {
        const regExp = /{([^{}]*)}/g;
        const res = _replaceAsync(formula, regExp, _processReplacement, context, value);
        return res;
    };
    return {
        id: 'excelCalculation',
        name: 'Excel calculation',
        description: 'Performs an excel calculation',
        input_types: [actionsList_1.ActionsListIOTypes.STRING, actionsList_1.ActionsListIOTypes.NUMBER],
        output_types: [actionsList_1.ActionsListIOTypes.STRING],
        params: [
            {
                name: 'Description',
                type: 'string',
                description: 'Quick description of your calculation',
                required: true,
                default_value: 'Your description'
            },
            {
                name: 'Formula',
                type: 'string',
                description: 'Excel formula to perform, place variables like so : {attribute_identifier}',
                required: true,
                default_value: '21*2'
            }
        ],
        action: async (value, params, ctx) => {
            const { Formula: formula } = params;
            const finalFormula = await _replaceVariables(formula, ctx, value);
            const parser = new hot_formula_parser_1.Parser();
            const { error, result } = parser.parse(finalFormula);
            if (error) {
                return utils.translateError({ msg: errors_1.Errors.EXCEL_CALCULATION_ERROR, vars: { error, formula: finalFormula } }, ctx.lang);
            }
            const finalResult = `${result}`;
            return finalResult;
        }
    };
}
exports.default = default_1;
