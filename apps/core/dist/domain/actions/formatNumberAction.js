"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const lodash_1 = require("lodash");
const actionsList_1 = require("../../_types/actionsList");
function default_1() {
    const _toString = (num, d) => num.toLocaleString('en', {
        minimumFractionDigits: d,
        maximumFractionDigits: d
    });
    const _formatSeparators = (num, thousSep, decSep) => {
        const newSeps = { ',': thousSep, '.': decSep };
        return num.replace(/[,.]/g, m => newSeps[m]);
    };
    const _addPrefix = (n, prefix) => '' + prefix + n;
    const _addSuffix = (n, suffix) => '' + n + suffix;
    return {
        id: 'formatNumber',
        name: 'Format Number',
        description: 'Format a number',
        input_types: [actionsList_1.ActionsListIOTypes.NUMBER],
        output_types: [actionsList_1.ActionsListIOTypes.STRING],
        params: [
            {
                name: 'decimals',
                type: 'number',
                description: 'Number of decimals',
                required: true,
                default_value: '2'
            },
            {
                name: 'thousandsSeparator',
                type: 'string',
                description: 'Thousands separator',
                required: false,
                default_value: ' '
            },
            {
                name: 'decimalsSeparator',
                type: 'string',
                description: 'Decimals separator',
                required: false,
                default_value: ','
            },
            {
                name: 'prefix',
                type: 'string',
                description: 'Number prefix',
                required: false,
                default_value: ''
            },
            {
                name: 'suffix',
                type: 'string',
                description: 'Number suffix',
                required: false,
                default_value: ''
            }
        ],
        action: (value, params, ctx) => {
            if (value === null) {
                return null;
            }
            const defaultParams = {
                decimals: 2,
                thousandsSeparator: ',',
                decimalsSeparator: '.',
                prefix: '',
                suffix: ''
            };
            const userParams = Object.assign(Object.assign({}, defaultParams), params);
            return isNaN(Number(value))
                ? ''
                : (0, lodash_1.flow)((0, lodash_1.partialRight)(_toString, userParams.decimals), (0, lodash_1.partialRight)(_formatSeparators, userParams.thousandsSeparator, userParams.decimalsSeparator), (0, lodash_1.partialRight)(_addPrefix, userParams.prefix), (0, lodash_1.partialRight)(_addSuffix, userParams.suffix))(Number(value));
        }
    };
}
exports.default = default_1;
