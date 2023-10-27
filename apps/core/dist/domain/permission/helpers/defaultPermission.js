"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1({ config }) {
    return {
        getDefaultPermission() {
            var _a;
            return (_a = config.permissions.default) !== null && _a !== void 0 ? _a : true;
        }
    };
}
exports.default = default_1;
