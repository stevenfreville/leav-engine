"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _types_1 = require("../_types");
function default_1(groupsId, permissionType, applyTo, permissionAction, key) {
    let k = `${_types_1.PERMISSIONS_CACHE_HEADER}`;
    k += !!groupsId && (groupsId === null || groupsId === void 0 ? void 0 : groupsId.length) ? `:${groupsId.sort().join('+')}` : ':';
    k += !!permissionType ? `:${permissionType}` : ':';
    k += !!applyTo && applyTo !== '' ? `:${applyTo}` : ':';
    k += !!permissionAction ? `:${permissionAction}` : ':';
    k += !!key && key !== '' ? `:${key}` : ':';
    return k;
}
exports.default = default_1;
