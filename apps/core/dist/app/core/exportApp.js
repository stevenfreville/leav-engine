"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_1 = require("apollo-server");
function default_1({ 'core.domain.export': exportDomain = null } = {}) {
    return {
        async getGraphQLSchema() {
            const baseSchema = {
                typeDefs: `
                    extend type Query {
                        export(library: ID!,  attributes: [ID!], filters: [RecordFilterInput], startAt: Int): String!
                    }
                `,
                resolvers: {
                    Upload: apollo_server_1.GraphQLUpload,
                    Query: {
                        async export(parent, { library, attributes, filters, startAt }, ctx) {
                            return exportDomain.export({ library, attributes, filters, ctx }, Object.assign({}, (!!startAt && { startAt })));
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
