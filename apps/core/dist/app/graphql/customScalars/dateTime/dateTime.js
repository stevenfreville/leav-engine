"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const graphql_1 = require("graphql");
function default_1({ 'core.utils': utils = null }) {
    return new graphql_1.GraphQLScalarType({
        name: 'DateTime',
        description: `The DateTime scalar type represents time data,
            represented as an ISO-8601 encoded UTC date string.`,
        parseValue(value) {
            // value from the client in a variable
            if (typeof value !== 'string' && typeof value !== 'number') {
                throw new Error(`Value must be a string or a number, received ${value}`);
            }
            return new Date(Number(value) * 1000);
        },
        serialize(value) {
            if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') {
                throw new Error(`Invalid date ${value}`);
            }
            const dateValue = value instanceof Date ? value : utils.timestampToDate(value);
            return dateValue.toISOString(); // value sent to the client
        },
        parseLiteral(ast) {
            // Value from the client directly in the query (no variable)
            if (ast.kind === graphql_1.Kind.STRING || ast.kind === graphql_1.Kind.INT) {
                return new Date(Number(ast.value) * 1000);
            }
            throw new Error('Value must be string or a number');
        }
    });
}
exports.default = default_1;
