"use strict";
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
Object.defineProperty(exports, "__esModule", { value: true });
class AuthenticationError extends Error {
    constructor(message = 'Unauthorized') {
        super();
        this.message = message;
    }
}
exports.default = AuthenticationError;
