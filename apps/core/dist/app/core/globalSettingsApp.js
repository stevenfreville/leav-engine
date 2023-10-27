"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const app_root_path_1 = require("@leav/app-root-path");
const node_path_1 = __importDefault(require("node:path"));
const globalSettings_1 = require("../../_constants/globalSettings");
const record_1 = require("../../_types/record");
function default_1({ 'core.app.helpers.initQueryContext': initQueryContext = null, 'core.domain.globalSettings': globalSettingsDomain = null, 'core.domain.record': recordDomain = null, 'core.utils.logger': logger = null, config = null }) {
    return {
        async getGraphQLSchema() {
            const baseSchema = {
                typeDefs: `
                    type GlobalSettings {
                        name: String!,
                        icon: Record
                    }

                    input GlobalSettingsIconInput {
                        library: String!,
                        recordId: String!
                    }

                    input GlobalSettingsInput {
                        name: String,
                        icon: GlobalSettingsIconInput
                    }

                    extend type Query {
                        globalSettings: GlobalSettings!
                    }

                    extend type Mutation {
                        saveGlobalSettings(settings: GlobalSettingsInput): GlobalSettings!
                    }
                `,
                resolvers: {
                    GlobalSettings: {
                        name: async (settings) => {
                            if (!settings.name) {
                                return globalSettings_1.APP_DEFAULT_NAME;
                            }
                            return settings.name;
                        },
                        icon: async (settings, _, ctx) => {
                            if (!settings.icon) {
                                return null;
                            }
                            const record = await recordDomain.find({
                                params: {
                                    library: settings.icon.library,
                                    filters: [
                                        {
                                            field: 'id',
                                            value: settings.icon.recordId,
                                            condition: record_1.AttributeCondition.EQUAL
                                        }
                                    ]
                                },
                                ctx
                            });
                            return record.list.length ? record.list[0] : null;
                        }
                    },
                    Query: {
                        globalSettings: async (_, args, ctx) => {
                            const settings = await globalSettingsDomain.getSettings(ctx);
                            return settings;
                        }
                    },
                    Mutation: {
                        saveGlobalSettings: (_, { settings }, ctx) => globalSettingsDomain.saveSettings({ settings, ctx })
                    }
                }
            };
            const fullSchema = { typeDefs: baseSchema.typeDefs, resolvers: baseSchema.resolvers };
            return fullSchema;
        },
        registerRoute(app) {
            const _initCtx = async (req, res, next) => {
                req.ctx = initQueryContext(req);
                req.ctx.userId = config.defaultUserId;
                req.ctx.groupsId = [];
                next();
            };
            const _handleError = async (err, req, res, next) => {
                var _a, _b;
                logger.error(`[${req.ctx.queryId}] ${err}`);
                logger.error(err.stack);
                res.status((_a = err.statusCode) !== null && _a !== void 0 ? _a : 500).send((_b = err.type) !== null && _b !== void 0 ? _b : 'Internal server error');
            };
            const _serveDefaultIcon = async (req, res, next) => {
                const rootPath = (0, app_root_path_1.appRootPath)();
                const defaultIconPath = node_path_1.default.resolve(rootPath, '../../assets/logo-leavengine.svg');
                res.sendFile(defaultIconPath);
            };
            app.get('/global-name', _initCtx, async (req, res, next) => {
                try {
                    const settings = await globalSettingsDomain.getSettings(req.ctx);
                    return res.status(200).send(settings.name || globalSettings_1.APP_DEFAULT_NAME);
                }
                catch (err) {
                    next(err);
                }
            }, _handleError);
            app.get('/global-lang', _initCtx, async (req, res, next) => {
                try {
                    return res.status(200).send(config.lang.default);
                }
                catch (err) {
                    next(err);
                }
            }, _handleError);
            app.get('/global-icon/:size', _initCtx, async (req, res, next) => {
                try {
                    const settings = await globalSettingsDomain.getSettings(req.ctx);
                    if (!settings.icon) {
                        _serveDefaultIcon(req, res, next);
                        return;
                    }
                    const fileRecord = (await recordDomain.find({
                        params: {
                            library: settings.icon.library,
                            filters: [
                                {
                                    field: 'id',
                                    value: settings.icon.recordId,
                                    condition: record_1.AttributeCondition.EQUAL
                                }
                            ]
                        },
                        ctx: req.ctx
                    })).list[0];
                    if (!fileRecord) {
                        _serveDefaultIcon(req, res, next);
                        return;
                    }
                    let previewPath = fileRecord.previews[req.params.size];
                    // Remove leading slash of previewPath
                    if (previewPath.startsWith('/')) {
                        previewPath = previewPath.slice(1);
                    }
                    const filePath = node_path_1.default.resolve(config.preview.directory, previewPath);
                    // Cache TTL is 1 day
                    res.set('Cache-Control', 'public, max-age=86400');
                    res.sendFile(filePath);
                }
                catch (err) {
                    next(err);
                }
            }, _handleError);
        }
    };
}
exports.default = default_1;
