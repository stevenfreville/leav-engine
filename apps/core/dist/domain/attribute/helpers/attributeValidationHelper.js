"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAttributeData = void 0;
const lodash_1 = require("lodash");
const ValidationError_1 = __importDefault(require("../../../errors/ValidationError"));
const actionsList_1 = require("../../../_types/actionsList");
const attribute_1 = require("../../../_types/attribute");
const errors_1 = require("../../../_types/errors");
const attributeALHelper_1 = require("./attributeALHelper");
const _validateSettings = (attrData, deps, ctx) => {
    const errors = {};
    if (!deps.utils.isIdValid(attrData.id)) {
        errors.id = errors_1.Errors.INVALID_ID_FORMAT;
    }
    if ((attrData.type === attribute_1.AttributeTypes.SIMPLE || attrData.type === attribute_1.AttributeTypes.SIMPLE_LINK) &&
        attrData.multiple_values) {
        errors.multiple_values = errors_1.Errors.MULTIPLE_VALUES_NOT_ALLOWED;
    }
    if (attrData.type !== attribute_1.AttributeTypes.SIMPLE && attrData.unique) {
        errors.unique = errors_1.Errors.UNIQUE_VALUE_NOT_ALLOWED;
    }
    return errors;
};
/**
 * Check if last actions's output type matches attribute allowed input type
 *
 * @param attrData
 */
const _validateInputType = (attrData, deps) => {
    const inputTypeErrors = {};
    if (!attrData.actions_list) {
        return inputTypeErrors;
    }
    const availableActions = deps.actionsListDomain.getAvailableActions();
    const allowedOutputTypes = (0, attributeALHelper_1.getAllowedOutputTypes)(attrData);
    for (const event of Object.values(actionsList_1.ActionsListEvents)) {
        if (!attrData.actions_list[event] || !attrData.actions_list[event].length) {
            continue;
        }
        const eventActions = attrData.actions_list[event];
        const lastAction = eventActions.slice(-1)[0];
        const lastActionDetails = availableActions.find(a => a.id === lastAction.id);
        if (!(0, lodash_1.intersection)(lastActionDetails.output_types, allowedOutputTypes[event]).length) {
            inputTypeErrors[`actions_list.${event}`] = {
                msg: errors_1.Errors.INVALID_ACTION_TYPE,
                vars: { expected: allowedOutputTypes[event], received: lastActionDetails.output_types }
            };
        }
    }
    return inputTypeErrors;
};
/**
 * Check if all required actions (flagged as system action) are present
 *
 * @param attrData
 */
const _validateRequiredActions = (attrData, deps) => {
    const requiredActionsErrors = {};
    if (!attrData.actions_list) {
        return requiredActionsErrors;
    }
    const defaultActions = deps.utils.getDefaultActionsList(attrData);
    const missingActions = [];
    for (const event of Object.keys(defaultActions)) {
        for (const defAction of defaultActions[event]) {
            if (defAction.is_system &&
                (!attrData.actions_list[event] || !attrData.actions_list[event].find(a => a.id === defAction.id))) {
                missingActions.push(`${event} => ${defAction.id}`);
            }
        }
    }
    if (missingActions.length) {
        requiredActionsErrors.actions_list = {
            msg: errors_1.Errors.MISSING_REQUIRED_ACTION,
            vars: { actions: missingActions.join(', ') }
        };
    }
    return requiredActionsErrors;
};
/**
 * Check if metadata fields are valid
 *
 * @param attrData
 * @param deps
 */
const _validateMetadataFields = async (attrData, deps, ctx) => {
    var _a;
    const metadataFieldsErrors = {};
    // Check metadata fields
    if ((_a = attrData.metadata_fields) === null || _a === void 0 ? void 0 : _a.length) {
        if (attrData.type === attribute_1.AttributeTypes.SIMPLE || attrData.type === attribute_1.AttributeTypes.SIMPLE_LINK) {
            throw new ValidationError_1.default({ metadata_fields: errors_1.Errors.CANNOT_SAVE_METADATA });
        }
        const filters = { type: [attribute_1.AttributeTypes.SIMPLE] };
        const metadatableAttrs = await deps.attributeRepo.getAttributes({
            params: {
                filters,
                strictFilters: true
            },
            ctx
        });
        const invalidAttributes = (0, lodash_1.difference)(attrData.metadata_fields, metadatableAttrs.list.map(a => a.id));
        if (invalidAttributes.length) {
            metadataFieldsErrors.metadata_fields = {
                msg: errors_1.Errors.INVALID_ATTRIBUTES,
                vars: { attributes: invalidAttributes.join(', ') }
            };
        }
        return metadataFieldsErrors;
    }
};
/**
 * Check if attribute has are required fields based on its type and format
 *
 * @param attrData
 * @param deps
 */
const _validateId = (attrData, deps) => {
    // Check required fields
    const idFieldErrors = {};
    const attributeForbiddenId = ['whoAmI', 'property'];
    if (attributeForbiddenId.indexOf(attrData.id) > -1) {
        idFieldErrors.id = errors_1.Errors.FORBIDDEN_ID;
    }
    return idFieldErrors;
};
/**
 * Check if attribute has are required fields based on its type and format
 *
 * @param attrData
 * @param deps
 */
const _validateRequiredFields = (attrData, deps) => {
    // Check required fields
    const requiredFieldsErrors = {};
    if (!attrData.type) {
        requiredFieldsErrors.type = errors_1.Errors.REQUIRED_ATTRIBUTE_TYPE;
    }
    if ((attrData.type === attribute_1.AttributeTypes.SIMPLE || attrData.type === attribute_1.AttributeTypes.ADVANCED) && !attrData.format) {
        requiredFieldsErrors.format = errors_1.Errors.REQUIRED_ATTRIBUTE_FORMAT;
    }
    if (!attrData.label[deps.config.lang.default]) {
        requiredFieldsErrors.label = { msg: errors_1.Errors.REQUIRED_ATTRIBUTE_LABEL, vars: { lang: deps.config.lang.default } };
    }
    if ((attrData.type === attribute_1.AttributeTypes.SIMPLE_LINK || attrData.type === attribute_1.AttributeTypes.ADVANCED_LINK) &&
        !attrData.linked_library) {
        requiredFieldsErrors.linked_library = errors_1.Errors.REQUIRED_ATTRIBUTE_LINKED_LIBRARY;
    }
    if (attrData.type === attribute_1.AttributeTypes.TREE && !attrData.linked_tree) {
        requiredFieldsErrors.linked_tree = errors_1.Errors.REQUIRED_ATTRIBUTE_LINKED_TREE;
    }
    return requiredFieldsErrors;
};
/**
 * Check if attribute has are required fields based on its type and format
 *
 * @param attrData
 * @param deps
 */
const _validateVersionProfile = async (attrData, deps, ctx) => {
    var _a;
    if (!((_a = attrData === null || attrData === void 0 ? void 0 : attrData.versions_conf) === null || _a === void 0 ? void 0 : _a.profile)) {
        return {};
    }
    const versionProfileErrors = {};
    const versionProfile = await deps.versionProfileDomain.getVersionProfiles({
        params: { filters: { id: attrData.versions_conf.profile } },
        ctx
    });
    if (!versionProfile.list.length) {
        versionProfileErrors.versions_conf = {
            msg: errors_1.Errors.UNKNOWN_VERSION_PROFILE,
            vars: { profile: attrData.versions_conf.profile }
        };
    }
    return versionProfileErrors;
};
const validateAttributeData = async (attrData, deps, ctx) => {
    const validationFuncs = [
        _validateSettings(attrData, deps, ctx),
        _validateRequiredFields(attrData, deps),
        _validateId(attrData, deps),
        _validateMetadataFields(attrData, deps, ctx),
        _validateInputType(attrData, deps),
        _validateRequiredActions(attrData, deps),
        _validateVersionProfile(attrData, deps, ctx)
    ];
    const validationRes = await Promise.all(validationFuncs);
    // Merge all errors into 1 object
    return validationRes.reduce((errors, res) => {
        return Object.assign(Object.assign({}, errors), res);
    }, {});
};
exports.validateAttributeData = validateAttributeData;
