"use strict";
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExecuteWithCount = void 0;
const isExecuteWithCount = (res) => {
    return typeof res.results !== 'undefined';
};
exports.isExecuteWithCount = isExecuteWithCount;
