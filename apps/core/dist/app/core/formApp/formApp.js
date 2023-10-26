"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1({ 'core.domain.attribute': attributeDomain = null, 'core.domain.form': formDomain = null, 'core.domain.library': libraryDomain = null, 'core.app.helpers.convertVersionFromGqlFormat': convertVersionFromGqlFormat = null, 'core.utils': utils = null } = {}) {
    /** Functions to convert form from GraphQL format to IForm*/
    const _convertFormFromGraphql = (form) => {
        const formattedForm = Object.assign({}, form);
        if (typeof form.elements !== 'undefined') {
            formattedForm.elements = Array.isArray(form.elements) ? form.elements.map(_convertElementsFromGraphql) : [];
        }
        return formattedForm;
    };
    const _convertElementsFromGraphql = (elementsWithDep) => (Object.assign(Object.assign({}, elementsWithDep), { elements: elementsWithDep.elements.map(_convertElementSettingsToObject) }));
    const _convertElementSettingsToObject = (element) => (Object.assign(Object.assign({}, element), { settings: utils.nameValArrayToObj(element.settings, 'key') }));
    const commonFormElementResolvers = {
        attribute: (formElement, _, ctx) => {
            var _a;
            const attributeId = (_a = formElement === null || formElement === void 0 ? void 0 : formElement.settings) === null || _a === void 0 ? void 0 : _a.attribute;
            if (!attributeId) {
                return null;
            }
            return attributeDomain.getAttributeProperties({ id: attributeId, ctx });
        },
        settings: (formElement, _, ctx) => {
            var _a;
            return Object.keys((_a = formElement.settings) !== null && _a !== void 0 ? _a : {}).map(async (settingsKey) => {
                const settingsValue = settingsKey !== 'columns'
                    ? formElement.settings[settingsKey]
                    : await Promise.all(formElement.settings[settingsKey].map(async (columnId) => {
                        const columnAttributeProps = await attributeDomain.getAttributeProperties({
                            id: columnId,
                            ctx
                        });
                        return {
                            id: columnAttributeProps.id,
                            label: columnAttributeProps.label
                        };
                    }));
                return {
                    key: settingsKey,
                    value: settingsValue
                };
            });
        }
    };
    return {
        getGraphQLSchema() {
            return {
                typeDefs: `
                    enum FormElementTypes {
                        layout
                        field
                    }

                    type Form {
                        id: ID!,
                        library: Library!,
                        system: Boolean!,
                        label(lang: [AvailableLanguage!]): SystemTranslation,
                        dependencyAttributes: [Attribute!],
                        elements: [FormElementsByDeps!]!
                    }

                    type RecordForm {
                        id: ID!,
                        recordId: ID,
                        library: Library!,
                        system: Boolean!,
                        label(lang: [AvailableLanguage!]): SystemTranslation,
                        elements: [FormElementWithValues!]!,
                        dependencyAttributes: [Attribute!],
                    }

                    input FormInput {
                        id: ID!,
                        library: ID!,
                        label: SystemTranslation,
                        dependencyAttributes: [ID!],
                        elements: [FormElementsByDepsInput!]
                    }

                    type FormDependencyValue {
                        attribute: ID!,
                        value: ID!
                    }

                    input FormDependencyValueInput {
                        attribute: ID!,
                        value: ID!
                    }

                    type FormElementsByDeps {
                        dependencyValue: FormDependencyValue,
                        elements: [FormElement!]!
                    }

                    input FormElementsByDepsInput {
                        dependencyValue: FormDependencyValueInput,
                        elements: [FormElementInput!]!
                    }

                    type FormElementSettings {
                        key: String!,
                        value: Any!
                    }

                    input FormElementSettingsInput {
                        key: String!,
                        value: Any!
                    }

                    type FormElement {
                        id: ID!,
                        containerId: ID!,
                        order: Int!,
                        uiElementType: String!,
                        type: FormElementTypes!,
                        attribute: Attribute,
                        settings: [FormElementSettings!]!
                    }

                    type FormElementWithValues {
                        id: ID!,
                        containerId: ID!,
                        order: Int!,
                        uiElementType: String!,
                        type: FormElementTypes!,
                        attribute: Attribute,
                        settings: [FormElementSettings!]!
                        values: [GenericValue!]
                        valueError: String
                    }

                    input FormElementInput {
                        id: ID!,
                        containerId: ID!,
                        order: Int!,
                        uiElementType: String!,
                        type: FormElementTypes!,
                        settings: [FormElementSettingsInput!]!
                    }

                    type FormsList {
                        totalCount: Int!,
                        list: [Form!]!
                    }


                    input FormFiltersInput {
                        library: ID!,
                        id: ID,
                        label: String,
                        system: Boolean
                    }

                    enum FormsSortableFields {
                        id
                        library
                        system
                    }

                    input SortForms {
                        field: FormsSortableFields!
                        order: SortOrder
                    }

                    extend type Query {
                        forms(
                            filters: FormFiltersInput!,
                            pagination: Pagination,
                            sort: SortForms
                        ): FormsList

                        # Returns form specific to a record.
                        # Only relevant elements are present, dependencies and permissions are already applied
                        recordForm(
                            recordId: String,
                            libraryId: String!,
                            formId: String!,
                            version: [ValueVersionInput!],
                        ): RecordForm
                    }

                    extend type Mutation {
                        saveForm(form: FormInput!): Form
                        deleteForm(library: ID!, id: ID!): Form
                    }
                `,
                resolvers: {
                    Query: {
                        async forms(_, { filters, pagination, sort }, ctx) {
                            return formDomain.getFormsByLib({
                                library: filters.library,
                                params: {
                                    filters,
                                    pagination,
                                    sort,
                                    withCount: true
                                },
                                ctx
                            });
                        },
                        async recordForm(_, { recordId, libraryId, formId, version }, ctx) {
                            const formattedVersion = convertVersionFromGqlFormat(version);
                            const recordForm = await formDomain.getRecordForm({
                                recordId,
                                libraryId,
                                formId,
                                version: formattedVersion,
                                ctx
                            });
                            return recordForm;
                        }
                    },
                    Mutation: {
                        async saveForm(_, { form }, ctx) {
                            const formattedForm = _convertFormFromGraphql(form);
                            return formDomain.saveForm({ form: formattedForm, ctx });
                        },
                        async deleteForm(_, { library, id }, ctx) {
                            return formDomain.deleteForm({ library, id, ctx });
                        }
                    },
                    Form: {
                        library: (form, _, ctx) => libraryDomain.getLibraryProperties(form.library, ctx),
                        dependencyAttributes: (form, _, ctx) => {
                            return Promise.all(form.dependencyAttributes.map(attr => attributeDomain.getAttributeProperties({ id: attr, ctx })));
                        }
                    },
                    RecordForm: {
                        library: (form, _, ctx) => libraryDomain.getLibraryProperties(form.library, ctx),
                        dependencyAttributes: (form, _, ctx) => {
                            var _a;
                            return Promise.all(((_a = form === null || form === void 0 ? void 0 : form.dependencyAttributes) !== null && _a !== void 0 ? _a : []).map(depAttribute => attributeDomain.getAttributeProperties({ id: depAttribute, ctx })));
                        }
                    },
                    FormElement: commonFormElementResolvers,
                    FormElementWithValues: commonFormElementResolvers
                }
            };
        }
    };
}
exports.default = default_1;
