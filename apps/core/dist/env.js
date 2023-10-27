"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const env = (_a = process.env.NODE_ENV) !== null && _a !== void 0 ? _a : 'production';
exports.env = env;
