"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const actionsList_1 = require("../../_types/actionsList");
function default_1() {
    return {
        id: 'toUppercase',
        name: 'To Uppercase',
        description: 'Convert the string to uppercase',
        input_types: [actionsList_1.ActionsListIOTypes.STRING],
        output_types: [actionsList_1.ActionsListIOTypes.STRING],
        action: (value, params, ctx) => {
            return value !== null ? value.toUpperCase() : null;
        }
    };
}
exports.default = default_1;
