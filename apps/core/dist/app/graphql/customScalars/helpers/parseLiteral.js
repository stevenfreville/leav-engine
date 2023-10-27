"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const graphql_1 = require("graphql");
const _parseObject = (typeName, ast, variables) => {
    const value = Object.create(null);
    ast.fields.forEach(field => {
        value[field.name.value] = parseLiteral(typeName, field.value, variables);
    });
    return value;
};
const parseLiteral = (typeName, ast, variables) => {
    switch (ast.kind) {
        case graphql_1.Kind.STRING:
        case graphql_1.Kind.BOOLEAN:
            return ast.value;
        case graphql_1.Kind.INT:
        case graphql_1.Kind.FLOAT:
            return parseFloat(ast.value);
        case graphql_1.Kind.OBJECT:
            return _parseObject(typeName, ast, variables);
        case graphql_1.Kind.LIST:
            return ast.values.map(n => parseLiteral(typeName, n, variables));
        case graphql_1.Kind.NULL:
            return null;
        case graphql_1.Kind.VARIABLE:
            return variables ? variables[ast.name.value] : undefined;
        default:
            throw new TypeError(`${typeName} cannot represent value: ${(0, graphql_1.print)(ast)}`);
    }
};
exports.default = parseLiteral;
