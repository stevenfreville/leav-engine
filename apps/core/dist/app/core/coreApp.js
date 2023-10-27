"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const graphql_1 = require("graphql");
const graphql_type_json_1 = __importStar(require("graphql-type-json"));
const _parseLiteralAny = ast => {
    switch (ast.kind) {
        case graphql_1.Kind.BOOLEAN:
        case graphql_1.Kind.STRING:
            return ast.value;
        case graphql_1.Kind.INT:
        case graphql_1.Kind.FLOAT:
            return Number(ast.value);
        case graphql_1.Kind.LIST:
            return ast.values.map(_parseLiteralAny);
        case graphql_1.Kind.OBJECT:
            return ast.fields.reduce((accumulator, field) => {
                accumulator[field.name.value] = _parseLiteralAny(field.value);
                return accumulator;
            }, {});
        case graphql_1.Kind.NULL:
            return null;
        default:
            return ast.value;
    }
};
function default_1({ 'core.domain.core': coreDomain = null, 'core.domain.eventsManager': eventsManagerDomain = null, 'core.app.graphql': graphqlApp = null, 'core.app.graphql.customScalars.systemTranslation': systemTranslation = null, 'core.app.graphql.customScalars.dateTime': DateTime = null, 'core.app.graphql.customScalars.any': Any = null, config = null, translator = null } = ({} = {})) {
    return {
        async getGraphQLSchema() {
            const baseSchema = {
                typeDefs: `
                    scalar JSON
                    scalar JSONObject
                    scalar Any
                    scalar DateTime

                    enum AvailableLanguage {
                        ${config.lang.available.join(' ')}
                    }

                    scalar SystemTranslation
                    scalar SystemTranslationOptional

                    input Pagination {
                        limit: Int!,
                        offset: Int!
                    }

                    enum SortOrder {
                        asc
                        desc
                    }

                    extend type Query {
                        version: String!
                        langs: [String]!
                    }
                `,
                resolvers: {
                    Query: {
                        version: (parent, args, ctx) => coreDomain.getVersion(),
                        langs: (parent, args, ctx) => config.lang.available
                    },
                    Mutation: {},
                    JSON: graphql_type_json_1.default,
                    JSONObject: graphql_type_json_1.GraphQLJSONObject,
                    Any,
                    SystemTranslation: systemTranslation.getScalarType(),
                    SystemTranslationOptional: systemTranslation.getScalarType(true),
                    DateTime
                }
            };
            if (config.env === 'test') {
                baseSchema.typeDefs += `
                    extend type Mutation {
                        refreshSchema: Boolean
                    }
                `;
                baseSchema.resolvers.Mutation.refreshSchema = async () => {
                    return graphqlApp.generateSchema();
                };
            }
            const fullSchema = { typeDefs: baseSchema.typeDefs, resolvers: baseSchema.resolvers };
            return fullSchema;
        },
        filterSysTranslationField(fieldData, requestedLangs = []) {
            if (!fieldData) {
                return null;
            }
            if (!requestedLangs.length) {
                return fieldData;
            }
            return Object.keys(fieldData)
                .filter(labelLang => requestedLangs.includes(labelLang))
                .reduce((allLabel, labelLang) => {
                allLabel[labelLang] = fieldData[labelLang];
                return allLabel;
            }, {});
        },
        async initPubSubEventsConsumer() {
            return eventsManagerDomain.initPubSubEventsConsumer();
        },
        extensionPoints: {
            /**
             * Load some additional translations, afterwards available through the regular translator
             * Path given is the foler containing all translations for this plugin.
             * We consider foler is organized like so:
             * - first level is one folder per language
             * - in each folder, we have a json file for each namespace to load
             *
             * For example, if I want to load some translations for lang 'en' and namespace 'translation', I have:
             * [path]/en/translation.json
             *
             */
            registerTranslations: async (path) => {
                try {
                    await fs_1.promises.access(path, fs_1.constants.R_OK);
                }
                catch (e) {
                    throw new Error('Translations folder unknown or not readable: ' + path);
                }
                const lngFolders = await fs_1.promises.readdir(path);
                for (const lngFolder of lngFolders) {
                    const nsFiles = await fs_1.promises.readdir(path + '/' + lngFolder);
                    for (const nsFile of nsFiles) {
                        const fileContent = await Promise.resolve().then(() => __importStar(require(path + '/' + lngFolder + '/' + nsFile)));
                        const ns = nsFile.substring(0, nsFile.indexOf('.json'));
                        await translator.addResourceBundle(lngFolder, ns, fileContent, true);
                    }
                }
            }
        }
    };
}
exports.default = default_1;
