"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const bcrypt = __importStar(require("bcryptjs"));
const actionsList_1 = require("../../_types/actionsList");
function default_1() {
    return {
        id: 'encrypt',
        name: 'Encrypt',
        description: 'Encrypt value',
        input_types: [actionsList_1.ActionsListIOTypes.STRING],
        output_types: [actionsList_1.ActionsListIOTypes.STRING],
        action: async (value, params, ctx) => {
            if (value === null) {
                return null;
            }
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(value, salt);
            return hash;
        }
    };
}
exports.default = default_1;
