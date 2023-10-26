"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationError_1 = __importDefault(require("../../../errors/ValidationError"));
const attribute_1 = require("../../../_types/attribute");
const errors_1 = require("../../../_types/errors");
const record_1 = require("../../../_types/record");
/**
 * Return attributes to use in search from field sent by client.
 * This field is a string made of different parts, concatenate with a dot.
 * Example: created_by.login => will return the attribute created_by and login
 *
 * @param field
 * @param ctx
 */
const getAttributesFromField = async (params) => {
    var _a, _b, _c, _d, _e;
    const { field, condition, visitedLibraries = [], deps, ctx } = params;
    const { 'core.domain.attribute': attributeDomain = null, 'core.infra.library': libraryRepo = null, 'core.infra.tree': treeRepo = null } = deps;
    const _getLabelOrIdAttribute = async (library) => {
        var _a, _b;
        if (visitedLibraries.includes(library)) {
            return 'id';
        }
        visitedLibraries.push(library);
        const linkedLibraryProps = await libraryRepo.getLibraries({
            params: { filters: { id: library } },
            ctx
        });
        return linkedLibraryProps.list.length && ((_a = linkedLibraryProps.list[0].recordIdentityConf) === null || _a === void 0 ? void 0 : _a.label)
            ? (_b = linkedLibraryProps.list[0].recordIdentityConf) === null || _b === void 0 ? void 0 : _b.label
            : 'id'; // label is not configured, search on ID
    };
    const fields = field.split('.');
    if (!fields.length) {
        return [];
    }
    // Get type and format for first field => this is the "main" attribute we're filtering from
    const mainAttribute = await attributeDomain.getAttributeProperties({ id: fields[0], ctx });
    let attributes = [mainAttribute];
    switch (mainAttribute.type) {
        case attribute_1.AttributeTypes.SIMPLE:
        case attribute_1.AttributeTypes.ADVANCED:
            if (mainAttribute.format === attribute_1.AttributeFormats.EXTENDED) {
                // filter string is: <tree attribute>.<sub field>.<sub field>.<...>
                const [, ...extendedFields] = fields;
                for (const extendedField of extendedFields) {
                    attributes.push({
                        id: extendedField,
                        type: attribute_1.AttributeTypes.SIMPLE,
                        format: attribute_1.AttributeFormats.EXTENDED
                    });
                }
            }
            break;
        case attribute_1.AttributeTypes.SIMPLE_LINK:
        case attribute_1.AttributeTypes.ADVANCED_LINK: {
            // filter string is: <link attribute>.<child attribute>
            let [, childAttribute] = fields;
            // If we have not selected a sub-attribute on a link attribute, force search on label
            if (!childAttribute) {
                childAttribute = await _getLabelOrIdAttribute(mainAttribute.linked_library);
            }
            // Check if child attribute is really linked to library
            const attrLinkedLibraryAttributes = await attributeDomain.getLibraryAttributes(mainAttribute.linked_library, ctx);
            if (!attrLinkedLibraryAttributes.find(a => a.id === childAttribute)) {
                throw new ValidationError_1.default({ id: errors_1.Errors.INVALID_FILTER_FIELDS });
            }
            // Calling this function recursively will handle the case where child attribute is a link
            // For example, if we filter on "category.created_by", we'll actually search on category.created_by.label
            const subChildAttributes = condition !== record_1.AttributeCondition.IS_EMPTY && condition !== record_1.AttributeCondition.IS_NOT_EMPTY
                ? await getAttributesFromField({
                    field: childAttribute,
                    visitedLibraries,
                    condition,
                    deps,
                    ctx
                })
                : [];
            attributes = [...attributes, ...subChildAttributes];
            break;
        }
        case attribute_1.AttributeTypes.TREE: {
            // filter string is: <tree attribute>.<tree library>.<child attribute>
            const [, treeLibrary, childAttribute] = fields;
            if (!treeLibrary && !childAttribute) {
                // Get libraries linked to tree
                const linkedTree = await treeRepo.getTrees({
                    params: { filters: { id: mainAttribute.linked_tree } },
                    ctx
                });
                if (!linkedTree.list.length) {
                    throw new ValidationError_1.default({
                        id: { msg: errors_1.Errors.UNKNOWN_TREES, vars: { trees: [mainAttribute.linked_tree] } }
                    });
                }
                // Get label attribute for each library
                const treeLibraries = Object.keys((_a = linkedTree.list[0].libraries) !== null && _a !== void 0 ? _a : {});
                for (const treeLinkedLibrary of treeLibraries) {
                    const libProps = (_c = (_b = (await libraryRepo.getLibraries({
                        params: { filters: { id: treeLinkedLibrary } },
                        ctx
                    }))) === null || _b === void 0 ? void 0 : _b.list) === null || _c === void 0 ? void 0 : _c[0];
                    if (!libProps) {
                        // This means tree configuration is invalid, ignore this lib
                        continue;
                    }
                    try {
                        const libLabelAttributeProps = await attributeDomain.getAttributeProperties({
                            id: await _getLabelOrIdAttribute(libProps.id),
                            ctx
                        });
                        attributes.push(libLabelAttributeProps);
                    }
                    catch (err) {
                        // Ignore error, we just won't use this attribute for search
                    }
                }
            }
            else if (treeLibrary && !childAttribute) {
                const libProps = (_e = (_d = (await libraryRepo.getLibraries({
                    params: { filters: { id: treeLibrary } },
                    ctx
                }))) === null || _d === void 0 ? void 0 : _d.list) === null || _e === void 0 ? void 0 : _e[0];
                if (!libProps) {
                    // This means tree configuration is invalid, ignore this lib
                    break;
                }
                try {
                    const libLabelAttributeProps = await attributeDomain.getAttributeProperties({
                        id: libProps.recordIdentityConf.label,
                        ctx
                    });
                    attributes.push(libLabelAttributeProps);
                }
                catch (err) {
                    // Ignore error, we just won't use this attribute for search
                }
            }
            else {
                // Check if child attribute really exists
                const treeLibraryAttributes = await attributeDomain.getLibraryAttributes(treeLibrary, ctx);
                if (!treeLibraryAttributes.find(a => a.id === childAttribute)) {
                    throw new ValidationError_1.default({ id: errors_1.Errors.INVALID_FILTER_FIELDS });
                }
                // Calling this function recursively will handle the case where child attribute is a link
                // For example, if we filter on "category.created_by", we'll actually search on category.created_by.label
                const subChildAttributes = await getAttributesFromField({ field: childAttribute, condition, deps, ctx });
                attributes = [...attributes, ...subChildAttributes];
            }
            break;
        }
    }
    return attributes;
};
exports.default = getAttributesFromField;
