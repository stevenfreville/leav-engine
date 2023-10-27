"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const utils_1 = require("@leav/utils");
const ValidationError_1 = __importDefault(require("../../../errors/ValidationError"));
const errors_1 = require("../../../_types/errors");
const filesManager_1 = require("../../../_types/filesManager");
const library_1 = require("../../../_types/library");
const permissions_1 = require("../../../_types/permissions");
const record_1 = require("../../../_types/record");
function default_1({ 'core.domain.library': libraryDomain = null, 'core.domain.record': recordDomain = null, 'core.domain.attribute': attributeDomain = null, 'core.domain.tree': treeDomain = null, 'core.domain.view': viewDomain = null, 'core.domain.permission': permissionDomain = null, 'core.app.core.attribute': coreAttributeApp = null, 'core.app.graphql': graphqlApp = null, 'core.utils': utils = null, 'core.app.core': coreApp = null } = {}) {
    const _getLibGqlListType = libTypeName => libTypeName + 'List';
    return {
        async getGraphQLSchema() {
            const libraries = await libraryDomain.getLibraries({
                ctx: {
                    userId: '0',
                    queryId: 'libraryAppGenerateBaseSchema'
                }
            });
            const baseSchema = {
                typeDefs: `
                    enum LibraryBehavior {
                        ${Object.values(library_1.LibraryBehavior).join(' ')}
                    }

                    type LibraryPermissions {
                        ${Object.values(permissions_1.LibraryPermissionsActions)
                    .map(action => `${action}: Boolean!`)
                    .join(' ')}
                    }

                    # Specific names generated to query this library on GraphQL
                    type LibraryGraphqlNames {
                        query: String!,
                        type: String!,
                        list: String!,
                        searchableFields: String!,
                        filter: String!
                    }

                    type PreviewVersionSize {
                        name: String!,
                        size: Int!
                    }

                    type PreviewVersion {
                        background: String!,
                        density: Int!,
                        sizes: [PreviewVersionSize!]!
                    }

                    type LibraryPreviewsSettings {
                        label: SystemTranslation!,
                        description: SystemTranslation,
                        versions: PreviewVersion!,
                        system: Boolean!
                    }

                    # Application Library
                    type Library {
                        id: ID!,
                        system: Boolean,
                        label(lang: [AvailableLanguage!]): SystemTranslation,
                        icon: Record,
                        behavior: LibraryBehavior!,
                        attributes: [Attribute!],
                        fullTextAttributes: [Attribute!],
                        permissions_conf: Treepermissions_conf,
                        recordIdentityConf: RecordIdentityConf,
                        gqlNames: LibraryGraphqlNames!,
                        linkedTrees: [Tree!],
                        defaultView: View,
                        permissions: LibraryPermissions,
                        previewsSettings: [LibraryPreviewsSettings!]
                    }

                    input LibraryIconInput {
                        libraryId: String!,
                        recordId: String!
                    }

                    input PreviewVersionSizeInput {
                        name: String!,
                        size: Int!
                    }

                    input PreviewVersionInput {
                        background: String!,
                        density: Int!,
                        sizes: [PreviewVersionSizeInput!]!
                    }

                    input LibraryPreviewsSettingsInput {
                        label: SystemTranslation!,
                        description: SystemTranslationOptional,
                        versions: PreviewVersionInput!
                    }

                    input LibraryInput {
                        id: ID!
                        label: SystemTranslation,
                        icon: LibraryIconInput,
                        attributes: [ID!],
                        fullTextAttributes: [ID!],
                        behavior: LibraryBehavior,
                        permissions_conf: Treepermissions_confInput,
                        recordIdentityConf: RecordIdentityConfInput,
                        defaultView: ID,
                        previewsSettings: [LibraryPreviewsSettingsInput!]
                    }

                    input LibrariesFiltersInput {
                        id: [ID!],
                        label: [String!],
                        system: Boolean,
                        behavior: [LibraryBehavior!]
                    }

                    type LibrariesList {
                        totalCount: Int!,
                        list: [Library!]!
                    }

                    enum LibrariesSortableFields {
                        id
                        system
                        behavior
                    }

                    input SortLibraries {
                        field: LibrariesSortableFields!
                        order: SortOrder
                    }

                    type Query {
                        libraries(
                            filters: LibrariesFiltersInput,
                            strictFilters: Boolean,
                            pagination: Pagination,
                            sort: SortLibraries
                        ): LibrariesList
                    }

                    type Mutation {
                        saveLibrary(library: LibraryInput): Library!
                        deleteLibrary(id: ID): Library!
                    }
                `,
                resolvers: {
                    Query: {
                        async libraries(_, { filters, pagination, sort, strictFilters }, ctx) {
                            return libraryDomain.getLibraries({
                                params: { filters, withCount: true, pagination, sort, strictFilters },
                                ctx
                            });
                        }
                    },
                    Mutation: {
                        async saveLibrary(parent, { library }, ctx) {
                            if (typeof library.attributes !== 'undefined') {
                                library.attributes = library.attributes.map(attrName => ({
                                    id: attrName
                                }));
                            }
                            if (typeof library.fullTextAttributes !== 'undefined') {
                                library.fullTextAttributes = library.fullTextAttributes.map(fullTextAttrName => ({
                                    id: fullTextAttrName
                                }));
                            }
                            const savedLib = await libraryDomain.saveLibrary(library, ctx);
                            graphqlApp.generateSchema();
                            return savedLib;
                        },
                        async deleteLibrary(parent, { id }, ctx) {
                            const deletedLib = await libraryDomain.deleteLibrary(id, ctx);
                            graphqlApp.generateSchema();
                            return deletedLib;
                        }
                    },
                    Library: {
                        attributes: async (parent, args, ctx, info) => {
                            return attributeDomain.getLibraryAttributes(parent.id, ctx);
                        },
                        fullTextAttributes: async (parent, args, ctx, info) => {
                            return attributeDomain.getLibraryFullTextAttributes(parent.id, ctx);
                        },
                        /**
                         * Return library label, potentially filtered by requested language
                         */
                        label: (libData, args) => {
                            return coreApp.filterSysTranslationField(libData.label, args.lang || []);
                        },
                        icon: async (libData, _, ctx) => {
                            if (!libData.icon) {
                                return null;
                            }
                            const record = await recordDomain.find({
                                params: {
                                    library: libData.icon.libraryId,
                                    filters: [
                                        { field: 'id', value: libData.icon.recordId, condition: record_1.AttributeCondition.EQUAL }
                                    ]
                                },
                                ctx
                            });
                            return record.list.length ? record.list[0] : null;
                        },
                        linkedTrees: async (parent, args, ctx) => {
                            const trees = await treeDomain.getTrees({
                                params: {
                                    filters: {
                                        library: parent.id
                                    }
                                },
                                ctx
                            });
                            return trees.list;
                        },
                        gqlNames: parent => {
                            const libId = parent.id;
                            return (0, utils_1.getLibraryGraphqlNames)(libId);
                        },
                        defaultView: (library, _, ctx) => {
                            return library.defaultView ? viewDomain.getViewById(library.defaultView, ctx) : null;
                        },
                        permissions: (libData, _, ctx, infos) => {
                            const requestedActions = graphqlApp.getQueryFields(infos).map(field => field.name);
                            return requestedActions.reduce(async (allPermsProm, action) => {
                                const allPerms = await allPermsProm;
                                const isAllowed = await permissionDomain.isAllowed({
                                    type: permissions_1.PermissionTypes.LIBRARY,
                                    applyTo: libData.id,
                                    action: action,
                                    userId: ctx.userId,
                                    ctx
                                });
                                return Object.assign(Object.assign({}, allPerms), { [action]: isAllowed });
                            }, Promise.resolve({}));
                        }
                    }
                }
            };
            for (const lib of libraries.list) {
                // If library has no attribute at all, it means it's being created and we're just between library
                // creation and attributes linking. So just ignore it now, everyting will be ok when it's fully created.
                // Otherwise it will just break schema generation
                if (!lib.attributes.length) {
                    continue;
                }
                const gqlNames = (0, utils_1.getLibraryGraphqlNames)(lib.id);
                const libQueryName = gqlNames.query;
                const libTypeName = gqlNames.type;
                const isFileLibrary = lib.behavior === library_1.LibraryBehavior.FILES;
                baseSchema.typeDefs += `
                    type ${libTypeName} implements Record ${isFileLibrary ? '& FileRecord' : ''} {
                        library: Library!,
                        whoAmI: RecordIdentity!,
                        property(attribute: ID!): [GenericValue!],
                        ${await Promise.all(lib.attributes.map(
                //TODO: ignore attribute if null
                async (attr) => `${attr.id}: ${await coreAttributeApp.getGraphQLFormat(attr)}`))},
                        permissions: RecordPermissions!
                        ${isFileLibrary ? 'file_type: FileType!' : ''}
                    }

                    type ${_getLibGqlListType(libTypeName)} {
                        totalCount: Int,
                        cursor: RecordsListCursor,
                        list: [${libTypeName}!]!
                    }

                    extend type Query {
                        ${libQueryName}(
                            filters: [RecordFilterInput],
                            sort: RecordSortInput
                            version: [ValueVersionInput],
                            pagination: RecordsPagination,
                            retrieveInactive: Boolean,
                            searchQuery: String
                        ): ${gqlNames.list}!
                    }
                `;
                baseSchema.resolvers.Query[libQueryName] = async (parent, { filters, sort, version, pagination, retrieveInactive = false, searchQuery }, ctx, info) => {
                    const fields = graphqlApp.getQueryFields(info).map(f => f.name);
                    if (pagination &&
                        typeof pagination.offset !== 'undefined' &&
                        typeof pagination.cursor !== 'undefined') {
                        throw new ValidationError_1.default({ pagination: errors_1.Errors.PAGINATION_OFFSET_AND_CURSOR });
                    }
                    const formattedVersion = Array.isArray(version) && version.length
                        ? version.reduce((allVers, vers) => {
                            allVers[vers.treeId] = vers.treeNodeId;
                            return allVers;
                        }, {})
                        : null;
                    ctx.version = formattedVersion;
                    return recordDomain.find({
                        params: {
                            library: lib.id,
                            filters,
                            sort,
                            pagination,
                            options: { version: formattedVersion },
                            withCount: fields.includes('totalCount'),
                            retrieveInactive,
                            fulltextSearch: searchQuery
                        },
                        ctx
                    });
                };
                baseSchema.resolvers[libTypeName] = {
                    library: async (rec, _, ctx) => rec.library ? libraryDomain.getLibraryProperties(rec.library, ctx) : null,
                    whoAmI: async (rec, _, ctx) => {
                        return recordDomain.getRecordIdentity(rec, ctx);
                    },
                    property: async (parent, { attribute }, ctx) => {
                        return recordDomain.getRecordFieldValue({
                            library: lib.id,
                            record: parent,
                            attributeId: attribute,
                            options: {
                                version: ctx.version,
                                forceArray: true
                            },
                            ctx
                        });
                    },
                    permissions: (record, _, ctx, infos) => {
                        const requestedActions = graphqlApp.getQueryFields(infos).map(field => field.name);
                        return requestedActions.reduce(async (allPermsProm, action) => {
                            const allPerms = await allPermsProm;
                            const isAllowed = await permissionDomain.isAllowed({
                                type: permissions_1.PermissionTypes.RECORD,
                                applyTo: record.library,
                                action: action,
                                userId: ctx.userId,
                                target: {
                                    recordId: record.id
                                },
                                ctx
                            });
                            return Object.assign(Object.assign({}, allPerms), { [action]: isAllowed });
                        }, Promise.resolve({}));
                    }
                };
                if (lib.behavior === library_1.LibraryBehavior.FILES) {
                    baseSchema.resolvers[libTypeName].file_type = (parent) => {
                        return (0, utils_1.getFileType)(parent[filesManager_1.FilesAttributes.FILE_NAME]);
                    };
                }
                for (const libAttr of lib.attributes) {
                    baseSchema.resolvers[libTypeName][libAttr.id] = async (parent, _, ctx) => {
                        const val = await recordDomain.getRecordFieldValue({
                            library: lib.id,
                            record: parent,
                            attributeId: libAttr.id,
                            options: {
                                version: ctx.version
                            },
                            ctx
                        });
                        return Array.isArray(val) ? val.map(v => v === null || v === void 0 ? void 0 : v.value) : val === null || val === void 0 ? void 0 : val.value;
                    };
                }
            }
            const fullSchema = { typeDefs: baseSchema.typeDefs, resolvers: baseSchema.resolvers };
            return fullSchema;
        }
    };
}
exports.default = default_1;
