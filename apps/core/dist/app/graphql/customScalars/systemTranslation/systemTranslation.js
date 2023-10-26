"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const joi_1 = __importDefault(require("joi"));
const graphql_1 = require("graphql");
const parseLiteral_1 = __importDefault(require("../helpers/parseLiteral"));
function default_1({ config }) {
    const _validateValue = (val, optional) => {
        // We accept a key-value object, keys being an available language and value being a string.
        // The default language has to be present
        const validValueSchema = joi_1.default.object().keys(config.lang.available.reduce((acc, lng) => {
            return Object.assign(Object.assign({}, acc), { [lng]: lng === config.lang.default && !optional
                    ? joi_1.default.string().required()
                    : joi_1.default.string().optional().allow('') });
        }, {}));
        const isValid = validValueSchema.validate(val);
        if (isValid.error) {
            throw new Error(`Invalid system translation input: ${isValid.error.message}`);
        }
    };
    const getScalar = (optional = true) => new graphql_1.GraphQLScalarType({
        name: 'SystemTranslation',
        description: 'System entities fields translation (label...)',
        serialize: (val) => val,
        parseValue: (val) => {
            _validateValue(val, optional);
            return val;
        },
        parseLiteral: (valAst, valVariables) => {
            const objVal = (0, parseLiteral_1.default)('SystemTranslation', valAst, valVariables);
            _validateValue(objVal, optional);
            return objVal;
        }
    });
    return {
        getScalarType(optional = false) {
            return getScalar(optional);
        }
    };
}
exports.default = default_1;
