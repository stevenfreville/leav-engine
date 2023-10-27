"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const userDomain_1 = require("../../domain/user/userDomain");
function default_1({ 'core.domain.user': userDomain = null } = {}) {
    return {
        async getGraphQLSchema() {
            const baseSchema = {
                typeDefs: `
                    type UserData {
                        global: Boolean!,
                        data: Any
                    }

                    enum UserCoreDataKeys {
                        ${Object.values(userDomain_1.UserCoreDataKeys).join(' ')}
                    }

                    extend type Mutation {
                        saveUserData(key: String!, value: Any, global: Boolean!): UserData!
                    }

                    extend type Query {
                        userData(keys: [String!]!, global: Boolean): UserData!
                    }
                `,
                resolvers: {
                    Query: {
                        async userData(parent, { keys, global }, ctx) {
                            return userDomain.getUserData(keys, global, ctx);
                        }
                    },
                    Mutation: {
                        async saveUserData(parent, { key, value, global }, ctx) {
                            return userDomain.saveUserData({ key, value, global, ctx });
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
