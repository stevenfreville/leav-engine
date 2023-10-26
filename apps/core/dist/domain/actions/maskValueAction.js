"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const actionsList_1 = require("../../_types/actionsList");
function default_1() {
    return {
        id: 'maskValue',
        name: 'Mask Value',
        description: 'Mask any value by replacing with dots or empty string if no value',
        input_types: [actionsList_1.ActionsListIOTypes.STRING, actionsList_1.ActionsListIOTypes.NUMBER, actionsList_1.ActionsListIOTypes.OBJECT],
        output_types: [actionsList_1.ActionsListIOTypes.STRING],
        action: (value) => {
            return value !== null && value !== '' && (typeof value !== 'object' || Object.keys(value).length)
                ? '●●●●●●●'
                : '';
        }
    };
}
exports.default = default_1;
