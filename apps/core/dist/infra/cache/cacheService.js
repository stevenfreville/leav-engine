"use strict";
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECacheType = void 0;
var ECacheType;
(function (ECacheType) {
    ECacheType["DISK"] = "DISK";
    ECacheType["RAM"] = "RAM";
})(ECacheType = exports.ECacheType || (exports.ECacheType = {}));
function default_1({ 'core.infra.cache.ramService': ramService = null, 'core.infra.cache.diskService': diskService = null }) {
    return {
        getCache(type) {
            let cacheService;
            switch (type) {
                case ECacheType.DISK:
                    cacheService = diskService;
                    break;
                case ECacheType.RAM:
                    cacheService = ramService;
                    break;
            }
            return cacheService;
        },
        async memoize({ key, func, storeNulls, ctx }) {
            const cacheService = this.getCache(ECacheType.RAM);
            const cacheValue = await cacheService.getData([key]);
            if (cacheValue[0]) {
                return JSON.parse(cacheValue[0]);
            }
            const result = await func();
            if (result !== null || storeNulls) {
                cacheService.storeData({ key, data: JSON.stringify(result) });
            }
            return result;
        }
    };
}
exports.default = default_1;
