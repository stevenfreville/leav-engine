"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const actionsList_1 = require("../../_types/actionsList");
function default_1() {
    return {
        id: 'toString',
        name: 'To String',
        description: 'Convert value to string',
        input_types: [actionsList_1.ActionsListIOTypes.STRING, actionsList_1.ActionsListIOTypes.NUMBER, actionsList_1.ActionsListIOTypes.BOOLEAN],
        output_types: [actionsList_1.ActionsListIOTypes.STRING],
        action: (value, params, ctx) => {
            return value !== null ? '' + value : null;
        }
    };
}
exports.default = default_1;
