"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const utils_1 = require("@leav/utils");
const lodash_1 = require("lodash");
const omit_1 = __importDefault(require("lodash/omit"));
const PermissionError_1 = __importDefault(require("../../errors/PermissionError"));
const ValidationError_1 = __importDefault(require("../../errors/ValidationError"));
const attribute_1 = require("../../_types/attribute");
const errors_1 = require("../../_types/errors");
const forms_1 = require("../../_types/forms");
const list_1 = require("../../_types/list");
const permissions_1 = require("../../_types/permissions");
const getElementValues_1 = require("./helpers/getElementValues");
const mustIncludeElement_1 = require("./helpers/mustIncludeElement");
function default_1(deps = {}) {
    const { 'core.domain.attribute': attributeDomain = null, 'core.domain.permission.library': libraryPermissionDomain = null, 'core.domain.permission.recordAttribute': recordAttributePermissionDomain = null, 'core.domain.permission.attribute': attributePermissionDomain = null, 'core.domain.helpers.validate': validateHelper = null, 'core.domain.tree': treeDomain = null, 'core.infra.form': formRepo = null, 'core.utils': utils = null, 'core.utils.logger': logger = null, translator = null } = deps;
    const _canAccessAttribute = (attribute, libraryId, recordId, ctx) => {
        return recordId && libraryId
            ? recordAttributePermissionDomain.getRecordAttributePermission(permissions_1.RecordAttributePermissionsActions.ACCESS_ATTRIBUTE, ctx.userId, attribute, libraryId, recordId, ctx)
            : attributePermissionDomain.getAttributePermission({
                action: permissions_1.AttributePermissionsActions.ACCESS_ATTRIBUTE,
                attributeId: attribute,
                ctx
            });
    };
    const _getMissingFormDefaultProps = async ({ library, id, ctx }) => {
        const defaultElements = [
            {
                id: (0, lodash_1.uniqueId)(),
                containerId: utils_1.FORM_ROOT_CONTAINER_ID,
                order: 0,
                uiElementType: 'text_block',
                type: forms_1.FormElementTypes.layout,
                settings: { content: translator.t('forms.missing_form_warning', { idForm: id }) }
            },
            {
                id: (0, lodash_1.uniqueId)(),
                containerId: utils_1.FORM_ROOT_CONTAINER_ID,
                order: 1,
                uiElementType: 'divider',
                type: forms_1.FormElementTypes.layout,
                settings: null
            }
        ];
        const attributes = await attributeDomain.getLibraryAttributes(library, ctx);
        const nonReadonlyAttributes = attributes.filter(att => !(att === null || att === void 0 ? void 0 : att.readonly));
        const attributesElements = nonReadonlyAttributes.map((att, index) => {
            var _a, _b;
            const data = {
                id: (0, lodash_1.uniqueId)(),
                containerId: utils_1.FORM_ROOT_CONTAINER_ID,
                order: index + 2,
                uiElementType: 'input_field',
                type: forms_1.FormElementTypes.field,
                settings: {
                    label: ((_a = att.label) === null || _a === void 0 ? void 0 : _a[translator.language]) || att.id,
                    attribute: att.id
                }
            };
            switch (att.type) {
                case attribute_1.AttributeTypes.SIMPLE:
                case attribute_1.AttributeTypes.ADVANCED:
                    data.uiElementType = 'input_field';
                    break;
                case attribute_1.AttributeTypes.SIMPLE_LINK:
                case attribute_1.AttributeTypes.ADVANCED_LINK:
                    data.settings = {
                        displayRecordIdentity: true,
                        label: ((_b = att.label) === null || _b === void 0 ? void 0 : _b[translator.language]) || att.id,
                        attribute: att.id
                    };
                    data.uiElementType = 'link';
                    break;
                case attribute_1.AttributeTypes.TREE:
                    data.uiElementType = 'tree';
                    break;
            }
            return data;
        });
        const finalElements = [...defaultElements, ...attributesElements];
        return {
            library,
            elements: [
                {
                    elements: finalElements
                }
            ]
        };
    };
    return {
        async getFormsByLib({ library, params, ctx }) {
            const filters = Object.assign(Object.assign({}, params === null || params === void 0 ? void 0 : params.filters), { library });
            const initializedParams = Object.assign(Object.assign({}, params), { filters });
            await validateHelper.validateLibrary(library, ctx);
            if (typeof initializedParams.sort === 'undefined') {
                initializedParams.sort = { field: 'id', order: list_1.SortOrder.ASC };
            }
            return formRepo.getForms({ params: initializedParams, ctx });
        },
        async getRecordForm({ recordId, libraryId, formId, version, ctx }) {
            var _a;
            let formProps;
            try {
                formProps = await this.getFormProperties({ library: libraryId, id: formId, ctx });
            }
            catch (error) {
                if (error instanceof ValidationError_1.default) {
                    if (error.fields.id === errors_1.Errors.UNKNOWN_FORM) {
                        formProps = await _getMissingFormDefaultProps({ library: libraryId, id: formId, ctx });
                    }
                }
                else {
                    throw error;
                }
            }
            const flatElementsList = [];
            // Retrieve all relevant attributes in a hash map. It will be used later on to filter out empty containers
            const elementsHashMap = await formProps.elements.reduce(async (allElemsProm, elementsWithDeps) => {
                var _a;
                const allElems = await allElemsProm;
                // Check if elements must be included based on dependencies
                if (!(await (0, mustIncludeElement_1.mustIncludeElement)(elementsWithDeps, recordId, libraryId, deps, ctx))) {
                    return allElems;
                }
                // Retrieve all visible form elements (based on permissions), with their values
                for (const depElement of elementsWithDeps.elements) {
                    let isElementVisible;
                    let elementError;
                    try {
                        isElementVisible =
                            depElement.uiElementType === forms_1.FormElementTypes.layout ||
                                !((_a = depElement.settings) === null || _a === void 0 ? void 0 : _a.attribute) ||
                                (await _canAccessAttribute(depElement.settings.attribute, libraryId, recordId, ctx));
                    }
                    catch (error) {
                        // If something went wrong, we assume the element is not visible
                        isElementVisible = false;
                        logger.error(error);
                        logger.error('Form element was ', depElement);
                    }
                    if (isElementVisible) {
                        const { error: valueError, values } = await (0, getElementValues_1.getElementValues)({
                            element: depElement,
                            recordId,
                            libraryId,
                            version,
                            deps,
                            ctx
                        });
                        const depElementWithValues = Object.assign(Object.assign({}, depElement), { values, valueError: elementError || valueError, children: [] });
                        // Add elements to the flat list as well, as we'll to run through all elements easily
                        // to filters out empty containers
                        flatElementsList.push(depElementWithValues);
                        allElems[depElement.id] = depElementWithValues;
                        // Tabs are not real container, it's only in element's settings.
                        // We need to add it to hash map to be able to clear out empty tabs
                        if (depElement.uiElementType === utils_1.FormUIElementTypes.TABS && depElement.settings.tabs) {
                            for (const [i, tab] of depElement.settings.tabs.entries()) {
                                const tabContainer = {
                                    id: `${depElement.id}/${tab.id}`,
                                    type: forms_1.FormElementTypes.layout,
                                    uiElementType: utils_1.FormUIElementTypes.TAB_FIELDS_CONTAINER,
                                    children: [],
                                    values: null,
                                    order: i,
                                    containerId: depElement.id
                                };
                                flatElementsList.push(tabContainer);
                                allElems[tabContainer.id] = tabContainer;
                            }
                        }
                    }
                }
                return allElems;
            }, Promise.resolve({}));
            // Convert hash map to tree structure in order to filter out empty containers
            const elementsTree = [];
            for (const element of flatElementsList) {
                if (element.containerId !== utils_1.FORM_ROOT_CONTAINER_ID) {
                    (_a = elementsHashMap[element.containerId]) === null || _a === void 0 ? void 0 : _a.children.push(elementsHashMap[element.id]);
                }
                else {
                    elementsTree.push(elementsHashMap[element.id]);
                }
            }
            /**
             * Recursively filters out all empty containers:
             * if a container has children somewhere, keep it otherwise discard it.
             * If a form has no visible field at all, nothing will be returned, including all other layout elements
             */
            const _filterEmptyContainers = (elements) => {
                var _a;
                let elementsToKeep = [];
                let hasFields = false; // Used to inform caller about presence of a field
                // All elements here are brother in the form.
                // We check if each element is a field or a field somewhere in its descendants
                for (const elem of elements) {
                    let _childrenToKeep = [];
                    // We have children, let's check descendants.
                    if (elem.uiElementType === utils_1.FormUIElementTypes.FIELDS_CONTAINER ||
                        elem.uiElementType === utils_1.FormUIElementTypes.TAB_FIELDS_CONTAINER ||
                        elem.uiElementType === utils_1.FormUIElementTypes.TABS) {
                        const { hasFields: childHasFields, children } = _filterEmptyContainers(elem.children);
                        if (childHasFields) {
                            if (elem.uiElementType === utils_1.FormUIElementTypes.TABS) {
                                // If element is a tab => update settings
                                elem.settings.tabs = ((_a = elem.settings) !== null && _a !== void 0 ? _a : {}).tabs.filter(tab => children.some(c => c.id === `${elem.id}/${tab.id}`));
                            }
                            // If element has children we must keep element itself and its children
                            _childrenToKeep = [
                                (0, omit_1.default)(elem, ['children']),
                                ...children.filter(c => c.uiElementType !== utils_1.FormUIElementTypes.TAB_FIELDS_CONTAINER)
                            ];
                        }
                        hasFields = hasFields || childHasFields;
                    }
                    else {
                        _childrenToKeep = [(0, omit_1.default)(elem, ['children'])];
                        if (elem.type === forms_1.FormElementTypes.field) {
                            hasFields = true;
                        }
                    }
                    elementsToKeep = [...elementsToKeep, ..._childrenToKeep];
                }
                return { children: elementsToKeep, hasFields };
            };
            const formElements = _filterEmptyContainers(elementsTree).children;
            return {
                id: formId,
                recordId,
                system: formProps.system,
                library: libraryId,
                dependencyAttributes: formProps.dependencyAttributes,
                elements: formElements
            };
        },
        async getFormProperties({ library, id, ctx }) {
            const filters = { id, library };
            await validateHelper.validateLibrary(library, ctx);
            const forms = await formRepo.getForms({
                params: { filters, strictFilters: true, withCount: false },
                ctx
            });
            if (!forms.list.length) {
                throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_FORM });
            }
            return forms.list[0];
        },
        async saveForm({ form, ctx }) {
            var _a;
            const defaultParams = {
                id: '',
                library: '',
                system: false,
                dependencyAttributes: [],
                label: { fr: '', en: '' },
                elements: []
            };
            const filters = { library: form.library, id: form.id };
            // Check if form exists
            const forms = await formRepo.getForms({
                params: {
                    filters,
                    strictFilters: true,
                    withCount: false
                },
                ctx
            });
            const existingForm = !!forms.list.length;
            const dataToSave = existingForm
                ? Object.assign(Object.assign(Object.assign({}, defaultParams), forms.list[0]), form) : Object.assign(Object.assign({}, defaultParams), form);
            // Check permissions
            const permToCheck = permissions_1.LibraryPermissionsActions.ADMIN_LIBRARY;
            if (!(await libraryPermissionDomain.getLibraryPermission({
                libraryId: form.library,
                action: permToCheck,
                userId: ctx.userId,
                ctx
            }))) {
                throw new PermissionError_1.default(permToCheck);
            }
            await validateHelper.validateLibrary(dataToSave.library, ctx);
            // Validate ID
            if (!utils.isIdValid(dataToSave.id)) {
                throw new ValidationError_1.default({ id: errors_1.Errors.INVALID_ID_FORMAT });
            }
            // Extract attributes from form data
            if ((_a = dataToSave.elements) === null || _a === void 0 ? void 0 : _a.length) {
                const attributes = dataToSave.elements.reduce((attrs, { elements: elements }) => {
                    for (const elem of elements) {
                        if (elem.type === forms_1.FormElementTypes.field && typeof elem.settings.attribute !== 'undefined') {
                            attrs.push(elem.settings.attribute);
                        }
                    }
                    return attrs;
                }, []);
                // Check if they exist
                const existingAttributes = await attributeDomain.getAttributes({
                    params: { withCount: false },
                    ctx
                });
                const invalidAttributes = (0, lodash_1.difference)(attributes, existingAttributes.list.map(a => a.id));
                if (invalidAttributes.length) {
                    throw new ValidationError_1.default({
                        elements: {
                            msg: errors_1.Errors.UNKNOWN_FORM_ATTRIBUTES,
                            vars: { attributes: invalidAttributes.join(', ') }
                        }
                    });
                }
            }
            return existingForm
                ? formRepo.updateForm({ formData: dataToSave, ctx })
                : formRepo.createForm({ formData: dataToSave, ctx });
        },
        async deleteForm({ library, id, ctx }) {
            // Check permissions
            const permToCheck = permissions_1.LibraryPermissionsActions.ADMIN_LIBRARY;
            if (!(await libraryPermissionDomain.getLibraryPermission({
                action: permToCheck,
                libraryId: library,
                userId: ctx.userId,
                ctx
            }))) {
                throw new PermissionError_1.default(permToCheck);
            }
            const filters = { library, id };
            // Check if form exists
            const forms = await formRepo.getForms({
                params: {
                    filters,
                    strictFilters: true,
                    withCount: false
                },
                ctx
            });
            if (!forms.list.length) {
                throw new ValidationError_1.default({ id: errors_1.Errors.UNKNOWN_FORM });
            }
            return formRepo.deleteForm({ formData: forms.list[0], ctx });
        }
    };
}
exports.default = default_1;
