"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const record_1 = require("../../../_types/record");
function default_1() {
    const _isAttributeFilter = (filter) => {
        return filter.condition in record_1.AttributeCondition;
    };
    const _isClassifyingFilter = (filter) => {
        return filter.condition in record_1.TreeCondition;
    };
    const _isCountFilter = (filter) => {
        return [
            record_1.AttributeCondition.VALUES_COUNT_EQUAL,
            record_1.AttributeCondition.VALUES_COUNT_GREATER_THAN,
            record_1.AttributeCondition.VALUES_COUNT_LOWER_THAN,
            record_1.AttributeCondition.IS_EMPTY,
            record_1.AttributeCondition.IS_NOT_EMPTY
        ].includes(filter.condition);
    };
    return {
        isAttributeFilter: _isAttributeFilter,
        isClassifyingFilter: _isClassifyingFilter,
        isCountFilter: _isCountFilter
    };
}
exports.default = default_1;
