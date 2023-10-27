"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const graphql_1 = require("graphql");
const parseLiteral_1 = __importDefault(require("../helpers/parseLiteral"));
function default_1() {
    return new graphql_1.GraphQLScalarType({
        name: 'Any',
        description: 'Can be anything',
        serialize: val => val,
        parseValue: val => val,
        parseLiteral: (ast, variables) => (0, parseLiteral_1.default)('Any', ast, variables)
    });
}
exports.default = default_1;
