"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const aql_1 = require("arangojs/aql");
const moment_1 = __importDefault(require("moment"));
const attribute_1 = require("../../../_types/attribute");
const record_1 = require("../../../_types/record");
function default_1() {
    return (valueIdentifier, condition, value, attribute) => {
        const valueField = typeof valueIdentifier === 'string' ? (0, aql_1.literal)(valueIdentifier) : valueIdentifier;
        switch (condition) {
            case record_1.AttributeCondition.EQUAL: {
                const cond = attribute.format === attribute_1.AttributeFormats.DATE
                    ? (0, aql_1.aql) `DATE_COMPARE(${valueField} * 1000, ${Number(value) * 1000}, "years", "days") == true`
                    : (0, aql_1.aql) `${valueField} == ${value}`;
                return cond;
            }
            case record_1.AttributeCondition.NOT_EQUAL:
                return attribute.format === attribute_1.AttributeFormats.DATE
                    ? (0, aql_1.aql) `DATE_COMPARE(${valueField} * 1000, ${Number(value) * 1000}, "years", "days") == false`
                    : (0, aql_1.aql) `${valueField} != ${value}`;
            case record_1.AttributeCondition.BEGIN_WITH:
                return (0, aql_1.aql) `${valueField} LIKE ${`${value}%`}`;
            case record_1.AttributeCondition.END_WITH:
                return (0, aql_1.aql) `${valueField} LIKE ${`%${value}`}`;
            case record_1.AttributeCondition.CONTAINS: {
                return attribute.format === attribute_1.AttributeFormats.DATE_RANGE
                    ? (0, aql_1.aql) `(${Number(value)} >= ${valueField}.from AND ${Number(value)} <= ${valueField}.to)`
                    : (0, aql_1.aql) `${valueField} LIKE ${`%${value}%`}`;
            }
            case record_1.AttributeCondition.NOT_CONTAINS:
                return (0, aql_1.aql) `${valueField} NOT LIKE ${`%${value}%`}`;
            case record_1.AttributeCondition.GREATER_THAN:
                return (0, aql_1.aql) `${valueField} > ${Number(value)}`;
            case record_1.AttributeCondition.LESS_THAN:
                return (0, aql_1.aql) `(${valueField} != null AND ${valueField} < ${Number(value)})`;
            case record_1.AttributeCondition.IS_EMPTY:
                return (0, aql_1.aql) `${valueField} == null`;
            case record_1.AttributeCondition.IS_NOT_EMPTY:
                return (0, aql_1.aql) `${valueField} != null`;
            case record_1.AttributeCondition.BETWEEN:
                return (0, aql_1.aql) `(
                            ${valueField} >= ${Number(value.from)}
                            AND ${valueField} <= ${Number(value.to)}
                        )`;
            case record_1.AttributeCondition.TODAY:
                return (0, aql_1.aql) `DATE_COMPARE(${valueField} * 1000, DATE_NOW(), "years", "days") == true`;
            case record_1.AttributeCondition.YESTERDAY:
                return (0, aql_1.aql) `DATE_COMPARE(
                            ${valueField} * 1000,
                            DATE_SUBTRACT(DATE_NOW(), 1, "day"),
                            "years",
                            "days"
                        ) == true`;
            case record_1.AttributeCondition.TOMORROW:
                return (0, aql_1.aql) `DATE_COMPARE(
                            ${valueField} * 1000,
                            DATE_ADD(DATE_NOW(), 1, "day"),
                            "years",
                            "days"
                        ) == true`;
            case record_1.AttributeCondition.NEXT_MONTH: {
                const now = (0, moment_1.default)().unix();
                const nextMonth = (0, moment_1.default)().add(31, 'days').unix();
                return (0, aql_1.aql) `(${valueField} >= ${now} AND ${valueField} <=${nextMonth})`;
            }
            case record_1.AttributeCondition.LAST_MONTH: {
                const now = (0, moment_1.default)().unix();
                const lastMonth = (0, moment_1.default)().subtract(31, 'days').unix();
                return (0, aql_1.aql) `(${valueField} >= ${lastMonth} AND ${valueField} <=${now})`;
            }
            case record_1.AttributeCondition.START_ON:
                return (0, aql_1.aql) `DATE_COMPARE(${valueField}.from * 1000, ${Number(value) * 1000}, "years", "days") == true`;
            case record_1.AttributeCondition.START_BEFORE:
                return (0, aql_1.aql) `(${valueField}.from != null AND ${valueField}.from < ${Number(value)})`;
            case record_1.AttributeCondition.START_AFTER:
                return (0, aql_1.aql) `${valueField}.from > ${Number(value)}`;
            case record_1.AttributeCondition.END_ON:
                return (0, aql_1.aql) `DATE_COMPARE(${valueField}.to * 1000, ${Number(value) * 1000}, "years", "days") == true`;
            case record_1.AttributeCondition.END_BEFORE:
                return (0, aql_1.aql) `(${valueField}.to != null AND ${valueField}.to < ${Number(value)})`;
            case record_1.AttributeCondition.END_AFTER:
                return (0, aql_1.aql) `${valueField}.to > ${Number(value)}`;
            default:
                return (0, aql_1.aql) `${valueField} == ${value}`;
        }
    };
}
exports.default = default_1;
