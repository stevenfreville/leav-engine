"use strict";
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationErrorType = void 0;
var ApplicationErrorType;
(function (ApplicationErrorType) {
    ApplicationErrorType["UNKNOWN_APP_ERROR"] = "unknown_app";
    ApplicationErrorType["FORBIDDEN_ERROR"] = "forbidden";
})(ApplicationErrorType = exports.ApplicationErrorType || (exports.ApplicationErrorType = {}));
class ApplicationError extends Error {
    constructor(type, appEndpoint) {
        super(type);
        this._statusCodeByType = {
            [ApplicationErrorType.UNKNOWN_APP_ERROR]: 404,
            [ApplicationErrorType.FORBIDDEN_ERROR]: 403
        };
        this.type = type;
        this.statusCode = this._statusCodeByType[type];
        this.message = type;
        this.appEndpoint = appEndpoint;
    }
}
exports.default = ApplicationError;
