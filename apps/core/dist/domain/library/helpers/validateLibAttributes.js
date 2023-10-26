"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const getLibraryDefaultAttributes_1 = __importDefault(require("../../../utils/helpers/getLibraryDefaultAttributes"));
const errors_1 = require("../../../_types/errors");
exports.default = async (libraryData, attributes, deps, ctx) => {
    const errors = {};
    if (!attributes.length) {
        return {};
    }
    const availableAttributes = await deps.attributeDomain.getAttributes({ ctx });
    const defaultAttributes = (0, getLibraryDefaultAttributes_1.default)(libraryData.behavior, libraryData.id);
    const attributesById = availableAttributes.list.reduce((acc, a) => {
        acc[a.id] = a;
        return acc;
    }, {});
    // Ignore default attributes here. We consider they exist or are created somewhere else
    const unknownAttrs = (0, lodash_1.difference)(attributes.filter(a => !defaultAttributes.includes(a)), Object.keys(attributesById));
    if (unknownAttrs.length) {
        errors.attributes = { msg: errors_1.Errors.UNKNOWN_ATTRIBUTES, vars: { attributes: unknownAttrs.join(', ') } };
    }
    // Check if an attribute is system and not part of default library attributes
    const forbiddenSystemAttributes = attributes.filter(a => { var _a; return ((_a = attributesById[a]) === null || _a === void 0 ? void 0 : _a.system) && !defaultAttributes.includes(a); });
    if (forbiddenSystemAttributes.length) {
        errors.attributes = {
            msg: errors_1.Errors.CANNOT_ADD_SYSTEM_ATTRIBUTES,
            vars: { attributes: forbiddenSystemAttributes.join(', ') }
        };
    }
    return errors;
};
