"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../../_types/errors");
const permissions_1 = require("../../../_types/permissions");
const doesValueExist_1 = __importDefault(require("./doesValueExist"));
const _canSaveMetadata = async (valueExists, library, recordId, value, ctx, deps) => {
    const permToCheck = permissions_1.RecordAttributePermissionsActions.EDIT_VALUE;
    const errors = await Object.keys(value.metadata).reduce(async (allErrorsProm, field) => {
        const allErrors = await allErrorsProm;
        const canUpdateField = await deps.recordAttributePermissionDomain.getRecordAttributePermission(permToCheck, ctx.userId, field, library, recordId, ctx);
        if (!canUpdateField) {
            allErrors.push(field);
        }
        return allErrors;
    }, Promise.resolve([]));
    if (!errors.length) {
        return { canSave: true };
    }
    return {
        canSave: false,
        fields: { metadata: { msg: errors_1.Errors.METADATA_PERMISSION_ERROR, vars: { fields: errors.join(', ') } } },
        reason: permToCheck
    };
};
exports.default = async (params) => {
    const { attributeProps, value, library, recordId, ctx, deps, keepEmpty = false } = params;
    if (attributeProps.readonly) {
        return { canSave: false, reason: errors_1.Errors.READONLY_ATTRIBUTE };
    }
    const valueExists = (0, doesValueExist_1.default)(value, attributeProps);
    // Check permission
    const canUpdateRecord = await deps.recordPermissionDomain.getRecordPermission({
        action: permissions_1.RecordPermissionsActions.EDIT_RECORD,
        userId: ctx.userId,
        library,
        recordId,
        ctx
    });
    if (!canUpdateRecord) {
        return { canSave: false, reason: permissions_1.RecordPermissionsActions.EDIT_RECORD };
    }
    const permToCheck = permissions_1.RecordAttributePermissionsActions.EDIT_VALUE;
    const isAllowed = await deps.recordAttributePermissionDomain.getRecordAttributePermission(permToCheck, ctx.userId, attributeProps.id, library, recordId, ctx);
    if (!isAllowed) {
        return { canSave: false, reason: permToCheck };
    }
    // Check metadata permissions
    if (value.metadata) {
        return _canSaveMetadata(valueExists, library, recordId, value, ctx, {
            recordAttributePermissionDomain: deps.recordAttributePermissionDomain
        });
    }
    return { canSave: true };
};
