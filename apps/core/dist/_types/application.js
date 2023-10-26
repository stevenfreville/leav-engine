"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationEventTypes = exports.ApplicationTypes = exports.APPS_URL_PREFIX = void 0;
exports.APPS_URL_PREFIX = 'app';
var ApplicationTypes;
(function (ApplicationTypes) {
    ApplicationTypes["INTERNAL"] = "internal";
    ApplicationTypes["EXTERNAL"] = "external";
})(ApplicationTypes = exports.ApplicationTypes || (exports.ApplicationTypes = {}));
var ApplicationEventTypes;
(function (ApplicationEventTypes) {
    ApplicationEventTypes["SAVE"] = "SAVE";
    ApplicationEventTypes["DELETE"] = "DELETE";
})(ApplicationEventTypes = exports.ApplicationEventTypes || (exports.ApplicationEventTypes = {}));
