"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const actionsList_1 = require("../../_types/actionsList");
function default_1() {
    return {
        id: 'toJSON',
        name: 'To JSON',
        description: 'Convert value to a JSON string',
        input_types: [actionsList_1.ActionsListIOTypes.OBJECT],
        output_types: [actionsList_1.ActionsListIOTypes.STRING],
        action: (value, params, ctx) => {
            if (value === null) {
                return null;
            }
            return JSON.stringify(value);
        }
    };
}
exports.default = default_1;
