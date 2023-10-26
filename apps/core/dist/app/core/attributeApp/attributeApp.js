"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actionsList_1 = require("../../../_types/actionsList");
const attribute_1 = require("../../../_types/attribute");
const permissions_1 = require("../../../_types/permissions");
const record_1 = require("../../../_types/record");
const graphqlFormats_1 = require("./helpers/graphqlFormats");
function default_1(deps = {}) {
    const { 'core.domain.attribute': attributeDomain = null, 'core.domain.record': recordDomain = null, 'core.domain.library': libraryDomain = null, 'core.domain.tree': treeDomain = null, 'core.domain.permission': permissionDomain = null, 'core.domain.versionProfile': versionProfileDomain = null, 'core.app.graphql': graphqlApp = null, 'core.app.core': coreApp = null, 'core.utils': utils = null } = deps;
    const commonResolvers = {
        /**
         * Return attribute label, potentially filtered by requested language
         */
        label: async (attributeData, args) => {
            return coreApp.filterSysTranslationField(attributeData.label, args.lang || []);
        },
        description: async (attributeData, args) => {
            return coreApp.filterSysTranslationField(attributeData.description, args.lang || []);
        },
        input_types: (attributeData, _, ctx) => attributeDomain.getInputTypes({ attrData: attributeData, ctx }),
        output_types: (attributeData, _, ctx) => attributeDomain.getOutputTypes({ attrData: attributeData, ctx }),
        metadata_fields: async (attributeData, _, ctx) => !!attributeData.metadata_fields
            ? Promise.all(attributeData.metadata_fields.map(attrId => attributeDomain.getAttributeProperties({ id: attrId, ctx })))
            : null,
        libraries: (attributeData, _, ctx) => attributeDomain.getAttributeLibraries({ attributeId: attributeData.id, ctx }),
        permissions: (attributeData, { record }, ctx, infos) => {
            const requestedActions = graphqlApp.getQueryFields(infos).map(field => field.name);
            return requestedActions.reduce(async (allPermsProm, action) => {
                const allPerms = await allPermsProm;
                const hasRecordInformations = (record === null || record === void 0 ? void 0 : record.id) && (record === null || record === void 0 ? void 0 : record.library);
                const isAllowed = await permissionDomain.isAllowed({
                    type: hasRecordInformations ? permissions_1.PermissionTypes.RECORD_ATTRIBUTE : permissions_1.PermissionTypes.ATTRIBUTE,
                    applyTo: hasRecordInformations ? record.library : attributeData.id,
                    action: action,
                    userId: ctx.userId,
                    target: hasRecordInformations
                        ? {
                            recordId: record.id,
                            attributeId: attributeData.id
                        }
                        : null,
                    ctx
                });
                return Object.assign(Object.assign({}, allPerms), { [action]: isAllowed });
            }, Promise.resolve({}));
        }
    };
    return {
        async getGraphQLSchema() {
            const attributesInterfaceSchema = `
                id: ID!,
                type: AttributeType!,
                format: AttributeFormat,
                system: Boolean!,
                readonly: Boolean!,
                label(lang: [AvailableLanguage!]): SystemTranslation,
                description(lang: [AvailableLanguage!]): SystemTranslationOptional,
                actions_list: ActionsListConfiguration,
                permissions_conf: Treepermissions_conf,
                multiple_values: Boolean!,
                versions_conf: ValuesVersionsConf,
                input_types: ActionListIOTypes!,
                output_types: ActionListIOTypes!,
                metadata_fields: [StandardAttribute!],
                libraries: [Library!],

                # Permissions for this attribute.
                # If record is specified, returns permissions for this specific record, otherwise returns global attribute permissions
                permissions(record: AttributePermissionsRecord): AttributePermissions!
            `;
            const baseSchema = {
                typeDefs: `
                    enum AttributeType {
                        ${Object.values(attribute_1.AttributeTypes).join(' ')}
                    }

                    enum AttributeFormat {
                        ${Object.values(attribute_1.AttributeFormats).join(' ')}
                    }

                    enum ValueVersionMode {
                        simple
                        smart
                    }

                    enum IOTypes {
                        string
                        number
                        boolean
                        object
                    }

                    type ActionListIOTypes {
                        ${Object.values(actionsList_1.ActionsListEvents).map(event => `${event}: [IOTypes!]!`)}
                    }

                    input AttributePermissionsRecord {
                        id: String,
                        library: String!
                    }

                    type AttributePermissions {
                        ${Object.values(permissions_1.AttributePermissionsActions)
                    .map(action => `${action}: Boolean!`)
                    .join(' ')}
                    }


                    interface Attribute {
                        ${attributesInterfaceSchema}
                    }

                    # Application Attribute
                    type StandardAttribute implements Attribute {
                        ${attributesInterfaceSchema}
                        embedded_fields: [EmbeddedAttribute],
                        values_list: StandardValuesListConf,
                        unique: Boolean
                    }

                    type LinkAttribute implements Attribute{
                        ${attributesInterfaceSchema}
                        linked_library: Library,
                        values_list: LinkValuesListConf,
                        reverse_link: String
                    }

                    type TreeAttribute implements Attribute{
                        ${attributesInterfaceSchema}
                        linked_tree: Tree,
                        values_list: TreeValuesListConf
                    }

                    input AttributeInput {
                        id: ID!
                        type: AttributeType
                        format: AttributeFormat
                        label: SystemTranslation,
                        readonly: Boolean,
                        description: SystemTranslationOptional,
                        linked_library: String,
                        linked_tree: String,
                        embedded_fields: [EmbeddedAttributeInput],
                        actions_list: ActionsListConfigurationInput,
                        permissions_conf: Treepermissions_confInput,
                        multiple_values: Boolean,
                        versions_conf: ValuesVersionsConfInput,
                        metadata_fields: [String!],
                        values_list: ValuesListConfInput,
                        reverse_link: String,
                        unique: Boolean
                    }

                    type EmbeddedAttribute {
                        id: ID!,
                        format: AttributeFormat,
                        label: SystemTranslation,
                        description: SystemTranslationOptional,
                        validation_regex: String,
                        embedded_fields: [EmbeddedAttribute]
                    }

                    input EmbeddedAttributeInput {
                        id: ID!
                        format: AttributeFormat
                        label: SystemTranslation,
                        description: SystemTranslationOptional,
                        validation_regex: String,
                        embedded_fields: [EmbeddedAttributeInput]
                    }

                    type ValuesVersionsConf {
                        versionable: Boolean!,
                        mode: ValueVersionMode,
                        profile: VersionProfile
                    }

                    input ValuesVersionsConfInput {
                        versionable: Boolean!,
                        mode: ValueVersionMode,
                        profile: String
                    }

                    union StandardValuesListConf = StandardStringValuesListConf | StandardDateRangeValuesListConf

                    type StandardStringValuesListConf {
                        enable: Boolean!,
                        allowFreeEntry: Boolean,
                        values: [String!]
                    }
                    type StandardDateRangeValuesListConf {
                        enable: Boolean!,
                        allowFreeEntry: Boolean,
                        values: [DateRangeValue!]
                    }

                    type LinkValuesListConf {
                        enable: Boolean!,
                        allowFreeEntry: Boolean,
                        values: [Record!]
                    }

                    type TreeValuesListConf {
                        enable: Boolean!,
                        allowFreeEntry: Boolean,
                        values: [TreeNode!]
                    }

                    input ValuesListConfInput {
                        enable: Boolean!,
                        allowFreeEntry: Boolean,
                        values: [String!]
                    }

                    input AttributesFiltersInput {
                        id: ID,
                        type: [AttributeType],
                        format: [AttributeFormat],
                        label: String,
                        system: Boolean,
                        multiple_values: Boolean,
                        versionable: Boolean,
                        libraries: [String]
                    }

                    type AttributesList {
                        totalCount: Int!,
                        list: [Attribute!]!
                    }

                    enum AttributesSortableFields {
                        id
                        type
                        format
                        linked_library
                        linked_tree
                        multiple_values
                    }

                    input SortAttributes {
                        field: AttributesSortableFields!
                        order: SortOrder
                    }

                    extend type Query {
                        attributes(
                            filters: AttributesFiltersInput,
                            pagination: Pagination,
                            sort: SortAttributes
                        ): AttributesList
                    }

                    extend type Mutation {
                        saveAttribute(attribute: AttributeInput): Attribute!
                        deleteAttribute(id: ID): Attribute!
                    }
                `,
                resolvers: {
                    Query: {
                        async attributes(parent, { filters, pagination, sort }, ctx) {
                            return attributeDomain.getAttributes({
                                params: { filters, withCount: true, pagination, sort },
                                ctx
                            });
                        }
                    },
                    Mutation: {
                        async saveAttribute(parent, { attribute }, ctx) {
                            const savedAttr = await attributeDomain.saveAttribute({ attrData: attribute, ctx });
                            graphqlApp.generateSchema();
                            return savedAttr;
                        },
                        async deleteAttribute(parent, { id }, ctx) {
                            const deletedAttr = await attributeDomain.deleteAttribute({ id, ctx });
                            graphqlApp.generateSchema();
                            return deletedAttr;
                        }
                    },
                    Attribute: {
                        __resolveType: (attr) => {
                            switch (attr.type) {
                                case attribute_1.AttributeTypes.SIMPLE:
                                case attribute_1.AttributeTypes.ADVANCED:
                                    return 'StandardAttribute';
                                case attribute_1.AttributeTypes.SIMPLE_LINK:
                                case attribute_1.AttributeTypes.ADVANCED_LINK:
                                    return 'LinkAttribute';
                                case attribute_1.AttributeTypes.TREE:
                                    return 'TreeAttribute';
                            }
                        }
                    },
                    StandardAttribute: Object.assign(Object.assign({}, commonResolvers), { values_list: (attributeData) => {
                            return attributeData.values_list
                                ? Object.assign(Object.assign({}, attributeData.values_list), { attributeFormat: attributeData.format }) : null;
                        } }),
                    LinkAttribute: Object.assign(Object.assign({}, commonResolvers), { linked_library: (attributeData, _, ctx) => {
                            if (!attributeData.linked_library) {
                                return null;
                            }
                            return libraryDomain.getLibraryProperties(attributeData.linked_library, ctx);
                        }, values_list: (attributeData, a2, ctx) => {
                            var _a;
                            if (!((_a = attributeData === null || attributeData === void 0 ? void 0 : attributeData.values_list) === null || _a === void 0 ? void 0 : _a.enable)) {
                                return attributeData.values_list;
                            }
                            // Here, values is a list of record ID. Return record object instead
                            // TODO: this could be optimized if find() would allow searching for multiple IDs at once
                            return Object.assign(Object.assign({}, attributeData.values_list), { values: attributeData.values_list.values
                                    .map(async (recId) => {
                                    const record = await recordDomain.find({
                                        params: {
                                            library: attributeData.linked_library,
                                            filters: [
                                                { field: 'id', condition: record_1.AttributeCondition.EQUAL, value: recId }
                                            ]
                                        },
                                        ctx
                                    });
                                    return record.list.length ? record.list[0] : null;
                                })
                                    .filter(r => r !== null) // Remove invalid values (unknown records)
                             });
                        } }),
                    TreeAttribute: Object.assign(Object.assign({}, commonResolvers), { linked_tree: (attributeData, _, ctx) => {
                            if (!attributeData.linked_tree) {
                                return null;
                            }
                            return treeDomain.getTreeProperties(attributeData.linked_tree, ctx);
                        }, values_list: async (attributeData, _, ctx) => {
                            var _a;
                            ctx.treeId = attributeData.linked_tree;
                            if (!((_a = attributeData === null || attributeData === void 0 ? void 0 : attributeData.values_list) === null || _a === void 0 ? void 0 : _a.enable)) {
                                return attributeData.values_list;
                            }
                            // Here, values is a list of tree nodes
                            return Object.assign(Object.assign({}, attributeData.values_list), { values: (await Promise.all(attributeData.values_list.values.map(async (nodeId) => {
                                    const isInTree = await treeDomain.isNodePresent({
                                        treeId: attributeData.linked_tree,
                                        nodeId,
                                        ctx
                                    });
                                    // Add treeId to the tree node for further resolvers
                                    return isInTree ? { id: nodeId, treeId: attributeData.linked_tree } : null;
                                }))).filter(r => r !== null) });
                        } }),
                    StandardValuesListConf: {
                        __resolveType: (obj) => {
                            return obj.attributeFormat === attribute_1.AttributeFormats.DATE_RANGE
                                ? 'StandardDateRangeValuesListConf'
                                : 'StandardStringValuesListConf';
                        }
                    },
                    ValuesVersionsConf: {
                        profile: async (conf, args, ctx) => {
                            if (!conf.profile) {
                                return null;
                            }
                            return versionProfileDomain.getVersionProfileProperties({
                                id: conf.profile,
                                ctx
                            });
                        }
                    }
                }
            };
            const fullSchema = { typeDefs: baseSchema.typeDefs, resolvers: baseSchema.resolvers };
            return fullSchema;
        },
        async getGraphQLFormat(attribute) {
            var _a, _b, _c;
            let typeToReturn;
            if (attribute.id === 'id') {
                typeToReturn = 'ID!';
            }
            else if (attribute.type === attribute_1.AttributeTypes.SIMPLE_LINK ||
                attribute.type === attribute_1.AttributeTypes.ADVANCED_LINK) {
                typeToReturn = utils.libNameToTypeName(attribute.linked_library);
            }
            else if (attribute.type === attribute_1.AttributeTypes.TREE) {
                typeToReturn = 'TreeNode';
            }
            else {
                // Get actions list output type if any
                if (((_b = (_a = attribute === null || attribute === void 0 ? void 0 : attribute.actions_list) === null || _a === void 0 ? void 0 : _a.getValue) !== null && _b !== void 0 ? _b : []).length) {
                    typeToReturn = await (0, graphqlFormats_1.getFormatFromALConf)([...(_c = attribute === null || attribute === void 0 ? void 0 : attribute.actions_list) === null || _c === void 0 ? void 0 : _c.getValue], deps);
                }
                if (!typeToReturn) {
                    typeToReturn = (0, graphqlFormats_1.getFormatFromAttribute)(attribute.format);
                }
            }
            if (attribute.multiple_values) {
                typeToReturn = `[${typeToReturn}!]`;
            }
            return typeToReturn;
        }
    };
}
exports.default = default_1;
