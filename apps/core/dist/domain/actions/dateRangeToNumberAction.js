"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actionsList_1 = require("../../_types/actionsList");
function default_1() {
    return {
        id: 'dateRangeToNumber',
        name: 'dateRangeToNumber',
        description: 'Convert date range dates to numbers',
        input_types: [actionsList_1.ActionsListIOTypes.OBJECT],
        output_types: [actionsList_1.ActionsListIOTypes.OBJECT],
        action: (value) => {
            var _a, _b;
            const dateRangeValue = value;
            return { from: Number((_a = dateRangeValue.from) !== null && _a !== void 0 ? _a : ''), to: Number((_b = dateRangeValue.to) !== null && _b !== void 0 ? _b : '') };
        }
    };
}
exports.default = default_1;
