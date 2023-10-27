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
        id: 'formatDate',
        name: 'Format Date',
        description: 'Convert timestamp to a date',
        input_types: [actionsList_1.ActionsListIOTypes.NUMBER],
        output_types: [actionsList_1.ActionsListIOTypes.STRING],
        params: [
            {
                name: 'auto',
                type: 'boolean',
                description: 'Adapt format to current language',
                required: true,
                default_value: 'false'
            },
            {
                name: 'format',
                type: 'string',
                description: 'Date format. Available format: https://momentjs.com/docs/#/displaying/format/',
                required: false,
                default_value: 'DD/MM/YYYY HH:mm:ss'
            }
        ],
        action: (value, params, ctx) => {
            if (value === null) {
                return null;
            }
            const format = params.format;
            const auto = params.auto === 'true';
            const numberVal = Number(value);
            let newValue = '';
            if (!isNaN(numberVal)) {
                newValue = auto
                    ? new Date(numberVal * 1000).toLocaleString(ctx.lang)
                    : moment_1.default.unix(numberVal).format(format);
            }
            return newValue;
        }
    };
}
exports.default = default_1;
