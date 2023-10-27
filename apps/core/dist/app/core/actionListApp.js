"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actionsList_1 = require("../../_types/actionsList");
function default_1({ 'core.domain.actionsList': actionsListDomain = null, translator = null }) {
    return {
        async getGraphQLSchema() {
            const baseSchema = {
                typeDefs: `
                    enum ActionIOTypes {
                        ${actionsList_1.ActionsListIOTypes.STRING}
                        ${actionsList_1.ActionsListIOTypes.NUMBER}
                        ${actionsList_1.ActionsListIOTypes.BOOLEAN}
                        ${actionsList_1.ActionsListIOTypes.OBJECT}
                    }

                    type ActionParam {
                        name: String!,
                        type: String!,
                        description: String,
                        required: Boolean,
                        default_value: String
                    }

                    type Action {
                        id: ID!,
                        name: String!,
                        description: String,
                        input_types: [ActionIOTypes!]!,
                        output_types: [ActionIOTypes!]!,
                        params: [ActionParam!]
                    }

                    type ActionConfiguration {
                        id: ID!,
                        name: String!,
                        is_system: Boolean!,
                        params: [ActionConfigurationParam!]
                        error_message: SystemTranslationOptional,
                    }

                    type ActionsListConfiguration {
                        ${actionsList_1.ActionsListEvents.SAVE_VALUE}: [ActionConfiguration!]
                        ${actionsList_1.ActionsListEvents.GET_VALUE}: [ActionConfiguration!]
                        ${actionsList_1.ActionsListEvents.DELETE_VALUE}: [ActionConfiguration!]
                    }

                    input ActionsListConfigurationInput {
                        ${actionsList_1.ActionsListEvents.SAVE_VALUE}: [ActionConfigurationInput!]
                        ${actionsList_1.ActionsListEvents.GET_VALUE}: [ActionConfigurationInput!]
                        ${actionsList_1.ActionsListEvents.DELETE_VALUE}: [ActionConfigurationInput!]
                    }

                    input ActionConfigurationInput {
                        id: ID!,
                        params: [ActionConfigurationParamInput!],
                        error_message: SystemTranslationOptional,
                    }

                    type ActionConfigurationParam {
                        name: String!,
                        value: String!
                    }

                    input ActionConfigurationParamInput {
                        name: String!,
                        value: String!
                    }

                    extend type Query {
                        availableActions: [Action!]
                    }
                `,
                resolvers: {
                    Query: {
                        async availableActions(parent, args, ctx) {
                            const availableActions = actionsListDomain.getAvailableActions();
                            const translatedActionList = availableActions.map(action => {
                                action.description = translator.t(('actions.descriptions.' + action.id), {
                                    lng: ctx.lang,
                                    interpolation: { escapeValue: false }
                                });
                                action.name = translator.t(('actions.names.' + action.id), {
                                    lng: ctx.lang,
                                    interpolation: { escapeValue: false }
                                });
                                return action;
                            });
                            return translatedActionList;
                        }
                    },
                    Mutation: {}
                }
            };
            const fullSchema = { typeDefs: baseSchema.typeDefs, resolvers: baseSchema.resolvers };
            return fullSchema;
        },
        extensionPoints: {
            registerActions: (actionArray) => {
                actionsListDomain.registerActions(actionArray);
            }
        }
    };
}
exports.default = default_1;
