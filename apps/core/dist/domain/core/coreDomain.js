"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1() {
    return {
        getVersion() {
            var _a;
            return (_a = process.env.npm_package_version) !== null && _a !== void 0 ? _a : '';
        }
    };
}
exports.default = default_1;
