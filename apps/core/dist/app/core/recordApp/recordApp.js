"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const eventsManager_1 = require("../../../_types/eventsManager");
const permissions_1 = require("../../../_types/permissions");
const record_1 = require("../../../_types/record");
function default_1({ 'core.domain.record': recordDomain = null, 'core.domain.attribute': attributeDomain = null, 'core.domain.tree': treeDomain = null, 'core.domain.eventsManager': eventsManagerDomain = null, 'core.utils': utils = null, 'core.app.core.attribute': attributeApp = null, 'core.app.core.indexationManager': indexationManagerApp = null, 'core.app.helpers.convertVersionFromGqlFormat': convertVersionFromGqlFormat = null, 'core.app.core.subscriptionsHelper': subscriptionsHelper = null } = {}) {
    return {
        async getGraphQLSchema() {
            const systemAttributes = ['created_at', 'created_by', 'modified_at', 'modified_by', 'active'];
            const recordInterfaceDef = `
                id: ID!,
                library: Library!,
                whoAmI: RecordIdentity!
                property(attribute: ID!): [GenericValue!]
                ${await Promise.all(systemAttributes.map(async (a) => {
                const attrProps = await attributeDomain.getAttributeProperties({
                    id: a,
                    ctx: {
                        userId: '0',
                        queryId: 'recordAppGenerateBaseSchema'
                    }
                });
                return `${a}: ${await attributeApp.getGraphQLFormat(attrProps)}`;
            }))},
                permissions: RecordPermissions!
            `;
            const baseSchema = {
                typeDefs: `
                    scalar Preview

                    type RecordPermissions {
                        ${Object.values(permissions_1.RecordPermissionsActions)
                    .map(action => `${action}: Boolean!`)
                    .join(' ')}
                    }

                    interface Record {
                        ${recordInterfaceDef}
                    }

                    interface FileRecord {
                        ${recordInterfaceDef}
                        file_type: FileType!
                    }

                    type RecordIdentity {
                        id: ID!,
                        library: Library!,
                        label: String,
                        subLabel: String,
                        color: String,
                        preview: Preview
                    }

                    type RecordIdentityConf {
                        label: ID,
                        color: ID,
                        preview: ID,
                        treeColorPreview: ID,
                        subLabel: ID
                    }

                    input RecordIdentityConfInput {
                        label: ID,
                        color: ID,
                        preview: ID,
                        treeColorPreview: ID,
                        subLabel: ID
                    }

                    input RecordInput {
                        id: ID!
                        library: String!
                    }

                    # Records support on both offset and cursor. Cannot use both at the same time.
                    # If none is supplied, it will apply an offset 0. Cursors are always returned along the results
                    # ⚠️Sorting is disallowed when using cursor pagination
                    input RecordsPagination {
                        limit: Int!,
                        cursor: String,
                        offset: Int
                    }

                    # Cursors to use for navigation among a record list.
                    # If one a the cursors is null, it means there's nothing more to see in this direction
                    type RecordsListCursor {
                        prev: String,
                        next: String
                    }

                    type RecordsList {
                        totalCount: Int!,
                        list: [Record!]!
                    }


                    enum RecordFilterOperator {
                        AND
                        OR
                        OPEN_BRACKET
                        CLOSE_BRACKET
                    }

                    enum RecordFilterCondition {
                        ${Object.values(Object.assign(Object.assign({}, record_1.AttributeCondition), record_1.TreeCondition)).join(' ')}
                    }

                    type RecordFilter {
                        field: String,
                        value: String,
                        condition: RecordFilterCondition,
                        operator: RecordFilterOperator,
                        tree: Tree
                    }

                    input RecordFilterInput {
                        field: String,
                        value: String,
                        condition: RecordFilterCondition,
                        operator: RecordFilterOperator,
                        treeId: String
                    }

                    type RecordSort {
                        field: String!,
                        order: SortOrder!
                    }

                    input RecordSortInput {
                        field: String!,
                        order: SortOrder!
                    }

                    type RecordUpdateEvent {
                        record: Record!
                        updatedValues: [RecordUpdatedValues!]!
                    }

                    type RecordUpdatedValues {
                        attribute: String!,
                        value: GenericValue!
                    }

                    input RecordUpdateFilterInput {
                        libraries: [ID!],
                        records: [ID!],
                        ignoreOwnEvents: Boolean
                    }

                    input CreateRecordDataInput {
                        version: [ValueVersionInput!],
                        values: [ValueBatchInput!]
                    }

                    type CreateRecordValueSaveError {
                        type: String!,
                        attributeId: String!,
                        id_value: String,
                        input: String,
                        message: String
                    }

                    type CreateRecordResult {
                        record: Record,
                        valuesErrors: [CreateRecordValueSaveError!]
                    }

                    extend type Mutation {
                        createRecord(library: ID!, data: CreateRecordDataInput): CreateRecordResult!
                        deleteRecord(library: ID, id: ID): Record!
                        indexRecords(libraryId: String!, records: [String!]): Boolean!
                        deactivateRecords(libraryId: String!, recordsIds: [String!], filters: [RecordFilterInput!]): [Record!]!
                        purgeInactiveRecords(libraryId: String!): [Record!]!
                    }

                    extend type Subscription {
                        recordUpdate(filters: RecordUpdateFilterInput): RecordUpdateEvent!
                    }
                `,
                resolvers: {
                    Record: {
                        __resolveType(obj) {
                            return utils.libNameToTypeName(obj.library);
                        }
                    },
                    FileRecord: {
                        __resolveType(obj) {
                            return utils.libNameToTypeName(obj.library);
                        }
                    },
                    Mutation: {
                        async createRecord(_, { library, data }, ctx) {
                            const valuesVersion = (data === null || data === void 0 ? void 0 : data.version) ? convertVersionFromGqlFormat(data.version) : null;
                            const valuesToSave = data
                                ? data.values.map(value => (Object.assign(Object.assign({}, value), { version: valuesVersion, metadata: utils.nameValArrayToObj(value.metadata) })))
                                : null;
                            return recordDomain.createRecord({ library, values: valuesToSave, ctx });
                        },
                        async deleteRecord(parent, { library, id }, ctx) {
                            return recordDomain.deleteRecord({ library, id, ctx });
                        },
                        async indexRecords(parent, { libraryId, records }, ctx) {
                            await indexationManagerApp.indexDatabase(ctx, libraryId, records);
                            return true;
                        },
                        async deactivateRecords(parent, { libraryId, recordsIds, filters }, ctx) {
                            return recordDomain.deactivateRecordsBatch({ libraryId, recordsIds, filters, ctx });
                        },
                        async purgeInactiveRecords(parent, { libraryId }, ctx) {
                            return recordDomain.purgeInactiveRecords({ libraryId, ctx });
                        }
                    },
                    Subscription: {
                        recordUpdate: {
                            subscribe: (0, graphql_subscriptions_1.withFilter)(() => eventsManagerDomain.subscribe([eventsManager_1.TriggerNames.RECORD_UPDATE]), (event, { filters }, ctx) => {
                                var _a, _b;
                                if ((filters === null || filters === void 0 ? void 0 : filters.ignoreOwnEvents) && subscriptionsHelper.isOwnEvent(event, ctx)) {
                                    return false;
                                }
                                const { recordUpdate } = event;
                                let mustReturn = true;
                                if ((_a = filters === null || filters === void 0 ? void 0 : filters.records) === null || _a === void 0 ? void 0 : _a.length) {
                                    mustReturn = filters === null || filters === void 0 ? void 0 : filters.records.includes(recordUpdate === null || recordUpdate === void 0 ? void 0 : recordUpdate.record.id);
                                }
                                if (mustReturn && ((_b = filters === null || filters === void 0 ? void 0 : filters.libraries) === null || _b === void 0 ? void 0 : _b.length)) {
                                    mustReturn = filters === null || filters === void 0 ? void 0 : filters.libraries.includes(recordUpdate === null || recordUpdate === void 0 ? void 0 : recordUpdate.record.library);
                                }
                                return mustReturn;
                            })
                        }
                    },
                    RecordFilter: {
                        tree: async (recordFilter, _, ctx) => {
                            if (!recordFilter.treeId) {
                                return null;
                            }
                            return treeDomain.getTreeProperties(recordFilter.treeId, ctx);
                        }
                    },
                    Preview: new graphql_1.GraphQLScalarType({
                        name: 'Preview',
                        description: 'Object containing all previews available for a record',
                        serialize: val => val,
                        parseValue: val => val,
                        parseLiteral: ast => ast
                    })
                }
            };
            const fullSchema = { typeDefs: baseSchema.typeDefs, resolvers: baseSchema.resolvers };
            return fullSchema;
        }
    };
}
exports.default = default_1;
