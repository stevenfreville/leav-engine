"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const attribute_1 = require("../../../_types/attribute");
const errors_1 = require("../../../_types/errors");
const record_1 = require("../../../_types/record");
const doesValueExist_1 = __importDefault(require("./doesValueExist"));
const _validateLinkedRecord = async (value, attribute, deps, ctx) => {
    const idAttrProps = await deps.attributeDomain.getAttributeProperties({ id: 'id', ctx });
    let reverseLink;
    if (!!idAttrProps.reverse_link) {
        reverseLink = await deps.attributeDomain.getAttributeProperties({
            id: idAttrProps.reverse_link,
            ctx
        });
    }
    const records = await deps.recordRepo.find({
        libraryId: attribute.linked_library,
        filters: [
            {
                attributes: [Object.assign(Object.assign({}, idAttrProps), { reverse_link: reverseLink })],
                condition: record_1.AttributeCondition.EQUAL,
                value: value.value
            }
        ],
        ctx
    });
    return records.list.length
        ? { isValid: true }
        : {
            isValid: false,
            reason: {
                msg: errors_1.Errors.UNKNOWN_LINKED_RECORD,
                vars: { record: value.value, library: attribute.linked_library }
            }
        };
};
const _validateTreeLinkedRecord = async (value, attribute, deps, ctx) => {
    const nodeId = value.value;
    const isElementInTree = await deps.treeRepo.isNodePresent({
        treeId: attribute.linked_tree,
        nodeId,
        ctx
    });
    if (!isElementInTree) {
        return {
            isValid: false,
            reason: { msg: errors_1.Errors.ELEMENT_NOT_IN_TREE, vars: { element: value.value, tree: attribute.linked_tree } }
        };
    }
    return { isValid: true };
};
const _mustCheckLinkedRecord = (attribute) => {
    const linkTypes = [attribute_1.AttributeTypes.ADVANCED_LINK, attribute_1.AttributeTypes.SIMPLE_LINK, attribute_1.AttributeTypes.TREE];
    return linkTypes.includes(attribute.type);
};
const _validateVersion = async (value, deps, ctx) => {
    const trees = Object.keys(value.version);
    const existingTrees = await deps.treeRepo.getTrees({ ctx });
    const existingTreesIds = existingTrees.list.map(t => t.id);
    const badElements = await trees.reduce(async (prevErrors, treeName) => {
        // As our reduce function is async, we must wait for previous iteration to resolve
        const errors = await prevErrors;
        if (!existingTreesIds.includes(treeName)) {
            errors[treeName] = { msg: errors_1.Errors.UNKNOWN_VERSION_TREE, vars: { tree: treeName } };
            return errors;
        }
        const isPresent = await deps.treeRepo.isNodePresent({
            treeId: treeName,
            nodeId: value.version[treeName],
            ctx
        });
        if (!isPresent) {
            errors[treeName] = {
                msg: errors_1.Errors.ELEMENT_NOT_IN_TREE,
                vars: { element: value.version[treeName], tree: treeName }
            };
        }
        return errors;
    }, Promise.resolve({}));
    return badElements;
};
const _validateMetadata = (attribute, value) => {
    const errors = {};
    if (!value.metadata) {
        return;
    }
    // Check fields
    const valueMetaFields = Object.keys(value.metadata);
    const unknownFields = (0, lodash_1.difference)(valueMetaFields, attribute.metadata_fields);
    if (unknownFields.length) {
        errors.metadata = { msg: errors_1.Errors.UNKNOWN_METADATA_FIELDS, vars: { fields: unknownFields.join(', ') } };
    }
    return errors;
};
exports.default = async (params) => {
    let errors = {};
    const { attributeProps, value, library, recordId, deps, ctx } = params;
    const valueExists = (0, doesValueExist_1.default)(value, attributeProps);
    // Check if this value has already been registered for this attribute in this library
    if (typeof attributeProps.unique !== 'undefined' && attributeProps.unique) {
        const isValueUnique = await deps.valueRepo.isValueUnique({
            library,
            recordId,
            attribute: attributeProps,
            value,
            ctx
        });
        if (!isValueUnique) {
            errors[attributeProps.id] = errors_1.Errors.VALUE_NOT_UNIQUE;
        }
    }
    // Check if value ID actually exists
    if (valueExists) {
        const existingVal = await deps.valueRepo.getValueById({
            library,
            recordId,
            attribute: attributeProps,
            valueId: value.id_value,
            ctx
        });
        if (existingVal === null) {
            errors.id_value = errors_1.Errors.UNKNOWN_VALUE;
        }
    }
    if (!!value.version) {
        const badElements = await _validateVersion(value, deps, ctx);
        if (Object.keys(badElements).length) {
            for (const badVersion of Object.keys(badElements)) {
                errors[`version.${badVersion}`] = badElements[badVersion];
            }
        }
    }
    const metadataErrors = _validateMetadata(attributeProps, params.value);
    errors = Object.assign(Object.assign({}, errors), metadataErrors);
    if (_mustCheckLinkedRecord(attributeProps) && value.value !== null) {
        const linkedRecordValidationHandler = {
            [attribute_1.AttributeTypes.SIMPLE_LINK]: _validateLinkedRecord,
            [attribute_1.AttributeTypes.ADVANCED_LINK]: _validateLinkedRecord,
            [attribute_1.AttributeTypes.TREE]: _validateTreeLinkedRecord
        };
        const isValidLink = await linkedRecordValidationHandler[attributeProps.type](value, attributeProps, deps, ctx);
        if (!isValidLink.isValid) {
            errors[attributeProps.id] = isValidLink.reason;
        }
    }
    return errors;
};
