"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const utils_1 = require("@leav/utils");
const express_1 = __importDefault(require("express"));
const graphql_subscriptions_1 = require("graphql-subscriptions");
const auth_1 = require("../../_types/auth");
const eventsManager_1 = require("../../_types/eventsManager");
function default_1({ 'core.domain.filesManager': filesManagerDomain = null, 'core.app.helpers.initQueryContext': initQueryContext, 'core.app.auth': authApp = null, 'core.domain.eventsManager': eventsManager = null, 'core.utils.logger': logger = null, config = null }) {
    return {
        init: async () => filesManagerDomain.init(),
        async getGraphQLSchema() {
            const baseSchema = {
                typeDefs: `
                    enum FileType {
                        ${Object.values(utils_1.FileType).join(' ')}
                    }

                    input FileInput {
                        data: Upload!,
                        uid: String!,
                        size: Int,
                        replace: Boolean
                    }

                    type UploadData {
                        uid: String!,
                        record: Record!
                    }

                    input UploadFiltersInput {
                        userId: ID,
                        uid: String
                    }

                    type StreamProgress {
                        percentage: Int,
                        transferred: Int,
                        length: Int,
                        remaining: Int,
                        eta: Int,
                        runtime: Int,
                        delta: Int,
                        speed: Int
                    }

                    type UploadProgress {
                        uid: String!,
                        userId: String!,
                        progress: StreamProgress!
                    }

                    extend type Query {
                        doesFileExistAsChild(treeId: ID!, parentNode: ID, filename: String!): Boolean
                    }



                    extend type Mutation {
                        # Force previews generation for the given records. If filters is specified, it will perform a search applying these filters and generate previews for results. If both filters and recordIds are specified, filters will be ignored. If failedOnly is true, only failed previews will be generated.
                        forcePreviewsGeneration(
                            libraryId: ID!,
                            recordIds: [ID!],
                            filters: [RecordFilterInput],
                            failedOnly: Boolean,
                            previewVersionSizeNames: [String!]
                        ): Boolean!
                        upload(library: String!, nodeId: String!, files: [FileInput!]!): [UploadData!]!
                        createDirectory(library: String!, nodeId: String!, name: String!): Record!
                    }

                    extend type Subscription {
                        upload(filters: UploadFiltersInput): UploadProgress!
                    }
                `,
                resolvers: {
                    Query: {
                        async doesFileExistAsChild(_, { treeId, parentNode, filename }, ctx) {
                            return filesManagerDomain.doesFileExistAsChild({ treeId, filename, parentNodeId: parentNode !== null && parentNode !== void 0 ? parentNode : null }, ctx);
                        }
                    },
                    Mutation: {
                        async upload(_, { library, nodeId, files }, ctx) {
                            // progress before resolver?
                            const filesData = await Promise.all(files.map(async ({ data, uid, size, replace }) => ({
                                data: await data,
                                uid,
                                size,
                                replace
                            })));
                            return filesManagerDomain.storeFiles({ library, nodeId, files: filesData }, ctx);
                        },
                        async createDirectory(_, { library, nodeId, name }, ctx) {
                            return filesManagerDomain.createDirectory({ library, nodeId, name }, ctx);
                        },
                        async forcePreviewsGeneration(_, { libraryId, recordIds, filters, failedOnly, previewVersionSizeNames }, ctx) {
                            return filesManagerDomain.forcePreviewsGeneration({
                                libraryId,
                                recordIds,
                                filters,
                                failedOnly,
                                previewVersionSizeNames,
                                ctx
                            });
                        }
                    },
                    Subscription: {
                        upload: {
                            subscribe: (0, graphql_subscriptions_1.withFilter)(() => eventsManager.subscribe([eventsManager_1.TriggerNames.UPLOAD_FILE]), (payload, variables) => {
                                var _a, _b;
                                let toReturn = true;
                                if (typeof ((_a = variables.filters) === null || _a === void 0 ? void 0 : _a.userId) !== 'undefined') {
                                    toReturn = payload.upload.userId === variables.filters.userId;
                                }
                                if (toReturn && typeof ((_b = variables.filters) === null || _b === void 0 ? void 0 : _b.uid) !== 'undefined') {
                                    toReturn = payload.upload.uid === variables.filters.uid;
                                }
                                return toReturn;
                            })
                        }
                    }
                }
            };
            const fullSchema = { typeDefs: baseSchema.typeDefs, resolvers: baseSchema.resolvers };
            return fullSchema;
        },
        registerRoute(app) {
            app.get(`/${config.files.originalsPathPrefix}/:libraryId/:fileId`, async (req, res, next) => {
                req.ctx = initQueryContext(req);
                try {
                    const payload = await authApp.validateRequestToken(Object.assign(Object.assign({}, (req.query[auth_1.API_KEY_PARAM_NAME] && { apiKey: String(req.query[auth_1.API_KEY_PARAM_NAME]) })), { cookies: req.cookies }));
                    req.ctx.userId = payload.userId;
                    req.ctx.groupsId = payload.groupsId;
                    next();
                }
                catch (_a) {
                    res.status(403);
                }
            }, async (req, res, next) => {
                try {
                    // Retrieve file path from domain
                    const { libraryId, fileId } = req.params;
                    const originalPath = await filesManagerDomain.getOriginalPath({
                        ctx: req.ctx,
                        libraryId,
                        fileId
                    });
                    req.url = '/';
                    return express_1.default.static(originalPath)(req, res, next);
                }
                catch (err) {
                    next(err);
                }
            }, async (err, req, res, next) => {
                var _a, _b;
                logger.error(`[${req.ctx.queryId}] ${err}`);
                logger.error(err.stack);
                res.status((_a = err.statusCode) !== null && _a !== void 0 ? _a : 500).send((_b = err.type) !== null && _b !== void 0 ? _b : 'Internal server error');
            });
        }
    };
}
exports.default = default_1;
