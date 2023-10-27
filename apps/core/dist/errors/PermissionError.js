"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const errors_1 = require("../_types/errors");
class PermissionError extends Error {
    constructor(action, fields, message = 'Action forbidden') {
        super(message);
        this.type = errors_1.ErrorTypes.PERMISSION_ERROR;
        this.action = action;
        this.fields = fields;
    }
}
exports.default = PermissionError;
