"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1({ 'core.domain.versionProfile': versionProfileDomain = null, 'core.domain.tree': treeDomain = null }) {
    return {
        async getGraphQLSchema() {
            const baseSchema = {
                typeDefs: `
                    type VersionProfile {
                        id: String!,
                        label: SystemTranslation!
                        description: SystemTranslation,
                        trees: [Tree!]!
                        linkedAttributes: [Attribute!]!
                    }

                    input VersionProfileInput {
                        id: String!,
                        label: SystemTranslation,
                        description: SystemTranslationOptional,
                        trees: [String!]
                    }

                    input VersionProfilesFiltersInput {
                        id: ID,
                        label: String,
                        trees: String
                    }

                    enum VersionProfilesSortableFields {
                        id
                    }

                    input SortVersionProfilesInput {
                        field: VersionProfilesSortableFields!
                        order: SortOrder
                    }

                    type VersionProfileList {
                        totalCount: Int!
                        list: [VersionProfile!]!
                    }

                    extend type Query {
                        versionProfiles(
                            filters: VersionProfilesFiltersInput,
                            pagination: Pagination,
                            sort: SortVersionProfilesInput,
                        ): VersionProfileList!
                    }

                    extend type Mutation {
                        saveVersionProfile(versionProfile: VersionProfileInput!): VersionProfile!
                        deleteVersionProfile(id: String!): VersionProfile!
                    }
                `,
                resolvers: {
                    Query: {
                        versionProfiles(_, { filters, pagination, sort }, ctx) {
                            return versionProfileDomain.getVersionProfiles({
                                params: { filters, withCount: true, pagination, sort },
                                ctx
                            });
                        }
                    },
                    Mutation: {
                        saveVersionProfile(_, { versionProfile }, ctx) {
                            return versionProfileDomain.saveVersionProfile({ versionProfile, ctx });
                        },
                        deleteVersionProfile(_, { id }, ctx) {
                            return versionProfileDomain.deleteVersionProfile({ id, ctx });
                        }
                    },
                    VersionProfile: {
                        trees(versionProfile, _, ctx) {
                            return Promise.all(versionProfile.trees.map(treeId => treeDomain.getTreeProperties(treeId, ctx)));
                        },
                        linkedAttributes(versionProfile, _, ctx) {
                            return versionProfileDomain.getAttributesUsingProfile({ id: versionProfile.id, ctx });
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
