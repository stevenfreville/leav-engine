"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const moment_1 = __importDefault(require("moment"));
const actionsList_1 = require("../../_types/actionsList");
function default_1() {
    return {
        id: 'formatDateRange',
        name: 'Format Date Range',
        description: 'Convert range timestamps to a date',
        input_types: [actionsList_1.ActionsListIOTypes.OBJECT],
        output_types: [actionsList_1.ActionsListIOTypes.OBJECT],
        params: [
            {
                name: 'format',
                type: 'string',
                description: 'Date format. Available format: https://momentjs.com/docs/#/displaying/format/',
                required: true,
                default_value: 'DD/MM/YYYY HH:mm:ss'
            }
        ],
        action: (value, params) => {
            const dateRangeValue = value;
            if (value === null || !dateRangeValue.from || !dateRangeValue.to) {
                return null;
            }
            const format = params.format || '';
            const numberValFrom = dateRangeValue.from;
            const numberValTo = dateRangeValue.to;
            return {
                from: !isNaN(numberValFrom) ? moment_1.default.unix(numberValFrom).format(format) : '',
                to: !isNaN(numberValTo) ? moment_1.default.unix(numberValTo).format(format) : ''
            };
        }
    };
}
exports.default = default_1;
