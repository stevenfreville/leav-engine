"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1() {
    return {
        /**
         * Compute permissions out of an array. Looks for something different than null somewhere,
         * but keeps null if everything is null.
         * In case of true/false conflict, TRUE wins.
         *
         * @param permissions
         */
        reducePermissionsArray: permissions => permissions.reduce((globalPerm, valuePerm) => {
            if (globalPerm === null) {
                return valuePerm;
            }
            if (valuePerm !== null) {
                return globalPerm || valuePerm;
            }
            return globalPerm;
        }, null)
    };
}
exports.default = default_1;
