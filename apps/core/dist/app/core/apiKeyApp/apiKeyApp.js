"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const library_1 = require("../../../_types/library");
const record_1 = require("../../../_types/record");
function default_1({ 'core.domain.apiKey': apiKeyDomain = null, 'core.domain.record': recordDomain = null }) {
    return {
        async getGraphQLSchema() {
            const baseSchema = {
                typeDefs: `
                    type ApiKey {
                        id: String!,
                        label: String,
                        key: String,
                        createdAt: Int!,
                        createdBy: User!,
                        modifiedAt: Int!,
                        modifiedBy: User!
                        expiresAt: Int,
                        user: User!
                    }

                    input ApiKeyInput {
                        id: String,
                        label: String!,
                        expiresAt: Int,
                        userId: String!,
                    }

                    input ApiKeysFiltersInput {
                        label: String,
                        user_id: String,
                        createdBy: Int,
                        modifiedBy: Int
                    }

                    enum ApiKeysSortableFields {
                        label,
                        expiresAt,
                        createdBy,
                        createdAt,
                        modifiedBy,
                        modifiedAt
                    }

                    input SortApiKeysInput {
                        field: ApiKeysSortableFields!
                        order: SortOrder
                    }

                    type ApiKeyList {
                        totalCount: Int!
                        list: [ApiKey!]!
                    }

                    extend type Query {
                        apiKeys(
                            filters: ApiKeysFiltersInput,
                            pagination: Pagination,
                            sort: SortApiKeysInput,
                        ): ApiKeyList!
                    }

                    extend type Mutation {
                        saveApiKey(apiKey: ApiKeyInput!): ApiKey!
                        deleteApiKey(id: String!): ApiKey!
                    }
                `,
                resolvers: {
                    Query: {
                        apiKeys(_, { filters, pagination, sort }, ctx) {
                            return apiKeyDomain.getApiKeys({
                                params: { filters, withCount: true, pagination, sort },
                                ctx
                            });
                        }
                    },
                    Mutation: {
                        saveApiKey(_, { apiKey }, ctx) {
                            return apiKeyDomain.saveApiKey({ apiKey, ctx });
                        },
                        deleteApiKey(_, { id }, ctx) {
                            return apiKeyDomain.deleteApiKey({ id, ctx });
                        }
                    },
                    ApiKey: {
                        async user(apiKey, _, ctx) {
                            var _a, _b;
                            const result = await recordDomain.find({
                                params: {
                                    library: library_1.USERS_LIBRARY,
                                    filters: [{ field: 'id', condition: record_1.AttributeCondition.EQUAL, value: apiKey.userId }]
                                },
                                ctx
                            });
                            return (_b = (_a = result.list) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : null;
                        },
                        async createdBy(apiKey, _, ctx) {
                            var _a, _b;
                            const result = await recordDomain.find({
                                params: {
                                    library: library_1.USERS_LIBRARY,
                                    filters: [
                                        { field: 'id', condition: record_1.AttributeCondition.EQUAL, value: apiKey.createdBy }
                                    ]
                                },
                                ctx
                            });
                            return (_b = (_a = result.list) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : null;
                        },
                        async modifiedBy(apiKey, _, ctx) {
                            var _a, _b;
                            const result = await recordDomain.find({
                                params: {
                                    library: library_1.USERS_LIBRARY,
                                    filters: [
                                        { field: 'id', condition: record_1.AttributeCondition.EQUAL, value: apiKey.modifiedBy }
                                    ]
                                },
                                ctx
                            });
                            return (_b = (_a = result.list) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : null;
                        }
                    }
                }
            };
            const fullSchema = { typeDefs: baseSchema.typeDefs, resolvers: baseSchema.resolvers };
            return fullSchema;
        }
    };
}
exports.default = default_1;
