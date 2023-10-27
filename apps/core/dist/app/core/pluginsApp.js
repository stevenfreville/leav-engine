"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1({ 'core.domain.plugins': pluginsDomain }) {
    return {
        async getGraphQLSchema() {
            const baseSchema = {
                typeDefs: `
                    type Plugin {
                        name: String!,
                        description: String,
                        version: String,
                        author: String
                    }

                    extend type Query {
                        plugins: [Plugin!]!
                    }
                `,
                resolvers: {
                    Query: {
                        plugins() {
                            return pluginsDomain.getRegisteredPlugins().map(p => p.infos);
                        }
                    }
                }
            };
            const fullSchema = { typeDefs: baseSchema.typeDefs, resolvers: baseSchema.resolvers };
            return fullSchema;
        },
        registerPlugin(path, plugin) {
            return pluginsDomain.registerPlugin(path, plugin);
        }
    };
}
exports.default = default_1;
