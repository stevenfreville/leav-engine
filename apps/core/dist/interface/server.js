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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_core_1 = require("apollo-server-core");
const apollo_server_express_1 = require("apollo-server-express");
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const graphql_1 = require("graphql");
const graphql_upload_1 = require("graphql-upload");
const graphqlWS = __importStar(require("graphql-ws/lib/use/ws"));
const http_1 = require("http");
const uuid_1 = require("uuid");
const ws_1 = require("ws");
const auth_1 = require("../_types/auth");
const errors_1 = require("../_types/errors");
const AuthenticationError_1 = __importDefault(require("../errors/AuthenticationError"));
function default_1({ config: config = null, 'core.app.graphql': graphqlApp = null, 'core.app.auth': authApp = null, 'core.app.application': applicationApp = null, 'core.app.core': coreApp = null, 'core.utils.logger': logger = null, 'core.utils': utils = null, 'core.depsManager': depsManager = null } = {}) {
    const _handleError = (err, { context }) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const newError = Object.assign({}, err);
        const isGraphlValidationError = err.extensions && err.extensions.code === 'GRAPHQL_VALIDATION_FAILED';
        const errorType = (_b = (_a = err === null || err === void 0 ? void 0 : err.extensions.exception) === null || _a === void 0 ? void 0 : _a.type) !== null && _b !== void 0 ? _b : errors_1.ErrorTypes.INTERNAL_ERROR;
        const errorFields = (_d = (_c = err === null || err === void 0 ? void 0 : err.extensions.exception) === null || _c === void 0 ? void 0 : _c.fields) !== null && _d !== void 0 ? _d : {};
        const errorAction = (_f = (_e = err === null || err === void 0 ? void 0 : err.extensions.exception) === null || _e === void 0 ? void 0 : _e.action) !== null && _f !== void 0 ? _f : null;
        const errorCustomMessage = (_h = (_g = err === null || err === void 0 ? void 0 : err.extensions.exception) === null || _g === void 0 ? void 0 : _g.isCustomMessage) !== null && _h !== void 0 ? _h : false;
        // Translate errors details
        for (const [field, errorDetails] of Object.entries(errorFields)) {
            const toTranslate = typeof errorDetails === 'string' ? { msg: errorDetails, vars: {} } : errorDetails;
            const lang = (_j = context.lang) !== null && _j !== void 0 ? _j : config.lang.default;
            errorFields[field] = !errorCustomMessage ? utils.translateError(toTranslate, lang) : errorFields[field];
        }
        newError.extensions.code = errorType;
        newError.extensions.fields = errorFields;
        newError.extensions.action = errorAction;
        if (errorType === errors_1.ErrorTypes.VALIDATION_ERROR ||
            errorType === errors_1.ErrorTypes.PERMISSION_ERROR ||
            isGraphlValidationError) {
            return newError;
        }
        const errId = (0, uuid_1.v4)();
        // Error is logged with original message
        newError.message = `[${errId}] ${err.message}`;
        logger.error(`${newError.message}\n${((_l = (_k = err.extensions.exception) === null || _k === void 0 ? void 0 : _k.stacktrace) !== null && _l !== void 0 ? _l : []).join('\n')}`);
        if (!config.debug) {
            newError.message = `[${errId}] Internal Error`;
            (_m = newError.extensions) === null || _m === void 0 ? true : delete _m.exception;
        }
        return newError;
    };
    const _checkAuth = async (req, res, next) => {
        try {
            await authApp.validateRequestToken(Object.assign(Object.assign({}, (req.query[auth_1.API_KEY_PARAM_NAME] && { apiKey: String(req.query[auth_1.API_KEY_PARAM_NAME]) })), { cookies: req.cookies }));
            next();
        }
        catch (err) {
            next(err);
        }
    };
    return {
        async init() {
            const app = (0, express_1.default)();
            const httpServer = (0, http_1.createServer)(app);
            try {
                // Express settings
                app.disable('x-powered-by');
                app.set('port', config.server.port);
                app.set('host', config.server.host);
                app.use(express_1.default.json({ limit: config.server.uploadLimit }));
                app.use(express_1.default.urlencoded({ extended: true, limit: config.server.uploadLimit }));
                app.use((0, graphql_upload_1.graphqlUploadExpress)());
                app.use((0, cookie_parser_1.default)());
                app.use((0, compression_1.default)({
                    threshold: 50 * 1024 // Files under 50kb won't be compressed
                }));
                // CORS
                app.use((req, res, next) => {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
                    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization');
                    return req.method === 'OPTIONS' ? res.sendStatus(204) : next();
                });
                // Initialize routes
                const modules = Object.keys(depsManager.registrations).filter(modName => modName.match(/^core\.app*/));
                for (const modName of modules) {
                    const appModule = depsManager.cradle[modName];
                    if (typeof appModule.registerRoute === 'function') {
                        await appModule.registerRoute(app);
                    }
                }
                app.use('/previews', [
                    _checkAuth,
                    express_1.default.static(config.preview.directory, { fallthrough: false }),
                    async (err, req, res, next) => {
                        const htmlContent = await fs_1.default.promises.readFile(__dirname + '/preview404.html', 'utf8');
                        res.status(404)
                            .type('html')
                            .send(htmlContent);
                    }
                ]);
                app.use(`/${config.export.endpoint}`, [_checkAuth, express_1.default.static(config.export.directory)]);
                app.use(`/${config.import.endpoint}`, [_checkAuth, express_1.default.static(config.import.directory)]);
                // Handling errors
                app.use((err, req, res, next) => {
                    if (!err) {
                        return next ? next() : res.end();
                    }
                    if (err instanceof SyntaxError) {
                        return res.status(400).json({ message: err.name });
                    }
                    if (err instanceof AuthenticationError_1.default) {
                        return res.status(401).send('Unauthorized');
                    }
                    logger.error(err);
                    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' }); // FIXME: format error msg?
                });
                await graphqlApp.generateSchema();
                const _executor = args => (0, graphql_1.execute)(Object.assign(Object.assign({}, args), { schema: graphqlApp.schema, contextValue: args.context, variableValues: args.request.variables }));
                // Create Web Socket Server
                const wsServer = new ws_1.WebSocketServer({
                    server: httpServer,
                    path: '/graphql'
                });
                // Hand in the schema we just created and have the
                // WebSocketServer start listening.
                const serverCleanup = graphqlWS.useServer({
                    schema: graphqlApp.schema,
                    context: async (ctx) => {
                        var _a;
                        try {
                            // recreate headers object from rawHeaders array
                            const headers = ctx.extra.request.rawHeaders.reduce((prev, curr, i, arr) => {
                                return !(i % 2) ? Object.assign(Object.assign({}, prev), { [curr]: arr[i + 1] }) : prev;
                            }, {});
                            const apiKeyIncluded = ctx.extra.request.url.includes(`${auth_1.API_KEY_PARAM_NAME}=`);
                            const cookieIncluded = (_a = headers.Cookie) === null || _a === void 0 ? void 0 : _a.includes(auth_1.ACCESS_TOKEN_COOKIE_NAME);
                            const payload = await authApp.validateRequestToken({
                                apiKey: apiKeyIncluded ? ctx.extra.request.url.split('key=')[1] : null,
                                cookies: cookieIncluded
                                    ? {
                                        [auth_1.ACCESS_TOKEN_COOKIE_NAME]: headers.Cookie.split('=')[headers.Cookie.split('=').indexOf(auth_1.ACCESS_TOKEN_COOKIE_NAME) + 1]
                                    }
                                    : null
                            });
                            const context = {
                                userId: payload.userId,
                                groupsId: payload.groupsId
                            };
                            return context;
                        }
                        catch (e) {
                            throw new apollo_server_express_1.AuthenticationError('you must be logged in');
                        }
                    }
                }, wsServer);
                const plugins = [
                    (0, apollo_server_core_1.ApolloServerPluginCacheControlDisabled)(),
                    {
                        async serverWillStart() {
                            return {
                                async drainServer() {
                                    await serverCleanup.dispose();
                                }
                            };
                        }
                    }
                ];
                if (config.debug) {
                    plugins.push(require('apollo-tracing').plugin());
                }
                const server = new apollo_server_express_1.ApolloServer({
                    // Always run in debug mode to have stacktrace in errors.
                    // Hiding error details in production is handled in _handleError
                    debug: true,
                    introspection: config.server.allowIntrospection,
                    plugins,
                    formatResponse: (resp, ctx) => {
                        const formattedResp = Object.assign({}, resp);
                        if (resp.errors) {
                            formattedResp.errors = resp.errors.map(e => _handleError(e, ctx));
                        }
                        const context = ctx.context;
                        if (context.dbProfiler) {
                            formattedResp.extensions = {
                                dbProfiler: Object.assign(Object.assign({}, context.dbProfiler), { 
                                    // Transform queries hash map into an array, sort queries by count
                                    queries: Object.values(context.dbProfiler.queries)
                                        .map(q => (Object.assign(Object.assign({}, q), { callers: [...q.callers] }))) // Transform callers Set into Array
                                        .sort((a, b) => b.count - a.count) })
                            };
                        }
                        return formattedResp;
                    },
                    context: async ({ req, res }) => {
                        var _a, _b;
                        try {
                            const payload = await authApp.validateRequestToken(Object.assign(Object.assign({}, (req.query[auth_1.API_KEY_PARAM_NAME] && { apiKey: String(req.query[auth_1.API_KEY_PARAM_NAME]) })), { cookies: req.cookies }));
                            const ctx = {
                                userId: payload.userId,
                                lang: (_a = req.query.lang) !== null && _a !== void 0 ? _a : config.lang.default,
                                defaultLang: config.lang.default,
                                queryId: req.body.requestId || (0, uuid_1.v4)(),
                                groupsId: payload.groupsId
                            };
                            return ctx;
                        }
                        catch (e) {
                            throw new apollo_server_express_1.AuthenticationError((_b = e.message) !== null && _b !== void 0 ? _b : 'You must be logged in');
                        }
                    },
                    // We're using a gateway here instead of a simple schema definition because we need to be able
                    // to reload schema when a change occurs (new library, new attribute...)
                    gateway: {
                        load: () => Promise.resolve({
                            schema: graphqlApp.schema,
                            executor: _executor
                        }),
                        /**
                         * Init the function we want to call on schema change.
                         * The callback received here is an Apollo internal function which actually update
                         * the schema stored by Apollo Server. We init an event listener to execute this function
                         * when a change occurs (new library, new attribute...)
                         */
                        onSchemaChange: callback => {
                            graphqlApp.schemaUpdateEmitter.on(graphqlApp.SCHEMA_UPDATE_EVENT, callback);
                            return () => graphqlApp.schemaUpdateEmitter.off(graphqlApp.SCHEMA_UPDATE_EVENT, callback);
                        },
                        stop: Promise.resolve
                    }
                });
                await server.start();
                server.applyMiddleware({ app, path: '/graphql', cors: true });
                applicationApp.registerRoute(app);
                await new Promise(resolve => httpServer.listen(config.server.port, resolve));
                logger.info(`🚀 Server ready at http://localhost:${config.server.port}${server.graphqlPath}`);
            }
            catch (e) {
                utils.rethrow(e, 'Server init error:');
            }
        },
        async initConsumers() {
            await graphqlApp.initSchemaUpdateConsumer();
            await coreApp.initPubSubEventsConsumer();
        }
    };
}
exports.default = default_1;
