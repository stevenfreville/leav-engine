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
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const app_root_path_1 = require("@leav/app-root-path");
const apollo_server_1 = require("apollo-server");
const express_1 = __importDefault(require("express"));
const glob_1 = __importDefault(require("glob"));
const graphql_subscriptions_1 = require("graphql-subscriptions");
const path_1 = __importDefault(require("path"));
const ApplicationError_1 = __importStar(require("../../errors/ApplicationError"));
const application_1 = require("../../_types/application");
const auth_1 = require("../../_types/auth");
const eventsManager_1 = require("../../_types/eventsManager");
const permissions_1 = require("../../_types/permissions");
const record_1 = require("../../_types/record");
function default_1({ 'core.app.auth': authApp = null, 'core.app.graphql': graphqlApp = null, 'core.app.helpers.initQueryContext': initQueryContext = null, 'core.app.core.subscriptionsHelper': subscriptionsHelper = null, 'core.domain.application': applicationDomain = null, 'core.domain.permission': permissionDomain = null, 'core.domain.permission.application': applicationPermissionDomain = null, 'core.domain.record': recordDomain, 'core.domain.eventsManager': eventsManagerDomain = null, 'core.utils.logger': logger = null, 'core.utils': utils = null, config = null } = {}) {
    return {
        async getGraphQLSchema() {
            const baseSchema = {
                typeDefs: `
                type ApplicationPermissions {
                    ${Object.values(permissions_1.ApplicationPermissionsActions)
                    .map(action => `${action}: Boolean!`)
                    .join(' ')}
                }

                enum ApplicationType {
                    ${Object.values(application_1.ApplicationTypes)
                    .map(type => `${type}`)
                    .join(' ')}
                }

                type Application {
                    id: ID!,
                    system: Boolean!,
                    type: ApplicationType!,
                    label(lang: [AvailableLanguage!]): SystemTranslation!,
                    description: SystemTranslation,
                    color: String,
                    icon: Record,
                    module: String,
                    endpoint: String,
                    url: String,
                    permissions: ApplicationPermissions!,
                    settings: JSONObject
                }

                type ApplicationModule {
                    id: ID!
                    description: String,
                    version: String
                }

                input ApplicationIconInput {
                    libraryId: String!,
                    recordId: String!
                }

                input ApplicationInput {
                    id: ID!
                    label: SystemTranslation,
                    type: ApplicationType,
                    description: SystemTranslationOptional,
                    color: String,
                    icon: ApplicationIconInput,
                    module: String,
                    endpoint: String,
                    settings: JSONObject
                }

                input ApplicationsFiltersInput {
                    id: ID,
                    label: String,
                    type: [ApplicationType],
                    system: Boolean,
                    endpoint: String,
                    module: String
                }

                type ApplicationsList {
                    totalCount: Int!,
                    list: [Application!]!
                }

                enum ApplicationSortableFields {
                    id
                    system
                    type
                    endpoint
                    module
                }

                input SortApplications {
                    field: ApplicationSortableFields!
                    order: SortOrder
                }

                enum ApplicationEventTypes {
                    ${Object.values(application_1.ApplicationEventTypes).join(' ')}
                }

                type ApplicationEvent {
                    type: ApplicationEventTypes!,
                    application: Application!
                }

                input ApplicationEventFiltersInput {
                    ${subscriptionsHelper.commonSubscriptionsFilters}

                    applicationId: ID,
                    events: [ApplicationEventTypes!]
                }

                extend type Query {
                    applications(
                        filters: ApplicationsFiltersInput,
                        pagination: Pagination,
                        sort: SortApplications
                    ): ApplicationsList
                    applicationsModules: [ApplicationModule!]!
                }

                extend type Mutation {
                    saveApplication(application: ApplicationInput!): Application!
                    deleteApplication(id: ID!): Application!
                }

                extend type Subscription {
                    applicationEvent(filters: ApplicationEventFiltersInput): ApplicationEvent!
                }
            `,
                resolvers: {
                    Upload: apollo_server_1.GraphQLUpload,
                    Query: {
                        async applications(parent, { filters, pagination, sort }, ctx) {
                            return applicationDomain.getApplications({
                                params: { filters, withCount: true, pagination, sort },
                                ctx
                            });
                        },
                        async applicationsModules(_, args, ctx) {
                            return applicationDomain.getAvailableModules({ ctx });
                        }
                    },
                    Mutation: {
                        async saveApplication(_, { application }, ctx) {
                            return applicationDomain.saveApplication({ applicationData: application, ctx });
                        },
                        async deleteApplication(_, { id }, ctx) {
                            return applicationDomain.deleteApplication({ id, ctx });
                        }
                    },
                    Subscription: {
                        applicationEvent: {
                            subscribe: (0, graphql_subscriptions_1.withFilter)(() => eventsManagerDomain.subscribe([eventsManager_1.TriggerNames.APPLICATION_EVENT]), (event, { filters }, ctx) => {
                                if ((filters === null || filters === void 0 ? void 0 : filters.ignoreOwnEvents) && subscriptionsHelper.isOwnEvent(event, ctx)) {
                                    return false;
                                }
                                const { applicationEvent } = event;
                                let mustReturn = true;
                                if (filters === null || filters === void 0 ? void 0 : filters.applicationId) {
                                    mustReturn = applicationEvent.application.id === filters.applicationId;
                                }
                                if (mustReturn && (filters === null || filters === void 0 ? void 0 : filters.events)) {
                                    mustReturn = filters.events.includes(applicationEvent.type);
                                }
                                return mustReturn;
                            })
                        }
                    },
                    Application: {
                        permissions: (appData, _, ctx, infos) => {
                            const requestedActions = graphqlApp.getQueryFields(infos).map(field => field.name);
                            return requestedActions.reduce(async (allPermsProm, action) => {
                                const allPerms = await allPermsProm;
                                const isAllowed = await permissionDomain.isAllowed({
                                    type: permissions_1.PermissionTypes.APPLICATION,
                                    applyTo: appData.id,
                                    action: action,
                                    userId: ctx.userId,
                                    ctx
                                });
                                return Object.assign(Object.assign({}, allPerms), { [action]: isAllowed });
                            }, Promise.resolve({}));
                        },
                        url: (appData, _, ctx) => {
                            return applicationDomain.getApplicationUrl({ application: appData, ctx });
                        },
                        icon: async (appData, _, ctx) => {
                            if (!appData.icon) {
                                return null;
                            }
                            const record = await recordDomain.find({
                                params: {
                                    library: appData.icon.libraryId,
                                    filters: [
                                        { field: 'id', value: appData.icon.recordId, condition: record_1.AttributeCondition.EQUAL }
                                    ]
                                },
                                ctx
                            });
                            return record.list.length ? record.list[0] : null;
                        }
                    }
                }
            };
            const fullSchema = { typeDefs: baseSchema.typeDefs, resolvers: baseSchema.resolvers };
            return fullSchema;
        },
        registerRoute(app) {
            // Serve applications from their endpoint
            app.get([`/${application_1.APPS_URL_PREFIX}/:endpoint`, `/${application_1.APPS_URL_PREFIX}/:endpoint/*`], 
            // Check authentication and parse token
            async (req, res, next) => {
                const endpoint = req.params.endpoint;
                req.ctx = initQueryContext(req);
                if (endpoint === 'login') {
                    return next();
                }
                try {
                    const payload = await authApp.validateRequestToken(Object.assign(Object.assign({}, (req.query[auth_1.API_KEY_PARAM_NAME] && { apiKey: String(req.query[auth_1.API_KEY_PARAM_NAME]) })), { cookies: req.cookies }));
                    req.ctx.userId = payload.userId;
                    req.ctx.groupsId = payload.groupsId;
                    next();
                }
                catch (_a) {
                    res.redirect(`/${application_1.APPS_URL_PREFIX}/login/?dest=${req.originalUrl}`);
                }
            }, 
            // Serve application
            async (req, res, next) => {
                try {
                    // Get available applications
                    const { endpoint } = req.params;
                    const application = { id: '', module: '' };
                    if (['portal', 'login'].includes(endpoint)) {
                        application.id = endpoint;
                        application.module = endpoint;
                    }
                    else {
                        const applications = await applicationDomain.getApplications({
                            params: {
                                filters: {
                                    endpoint
                                }
                            },
                            ctx: req.ctx
                        });
                        if (!applications.list.length) {
                            throw new ApplicationError_1.default(ApplicationError_1.ApplicationErrorType.UNKNOWN_APP_ERROR, endpoint);
                        }
                        const requestApplication = applications.list[0];
                        application.id = requestApplication.id;
                        application.module = requestApplication.module;
                    }
                    // Check permissions
                    const canAccess = await applicationPermissionDomain.getApplicationPermission({
                        action: permissions_1.ApplicationPermissionsActions.ACCESS_APPLICATION,
                        applicationId: application.id,
                        userId: req.ctx.userId,
                        ctx: req.ctx
                    });
                    if (!canAccess) {
                        throw new ApplicationError_1.default(ApplicationError_1.ApplicationErrorType.FORBIDDEN_ERROR, endpoint);
                    }
                    const rootPath = (0, app_root_path_1.appRootPath)();
                    const appFolder = path_1.default.resolve(rootPath, config.applications.rootFolder, application.module);
                    req.ctx.applicationId = application.id;
                    // Request will be handled by express as if it was a regular request to the app folder itself
                    // Thus, we remove the app endpoint from URL.
                    // We don't need the query params to render static files.
                    // Hence, affect path only (=url without query params) to url
                    // Try to locate a file at given path. If not found, serve root path of the app,
                    // considering it will be handle it client-side (eg. SPAs)
                    const newPath = req.path.replace(new RegExp(`^\/${utils.getFullApplicationEndpoint(endpoint)}`), '') || '/';
                    const files = await new Promise((resolve, reject) => (0, glob_1.default)(`${appFolder}${newPath}`, (err, matches) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(matches);
                    }));
                    const doesPathExists = !!files.length;
                    req.url = doesPathExists ? newPath : '/';
                    express_1.default.static(appFolder, {
                        extensions: ['html'],
                        fallthrough: false
                    })(req, res, next);
                    next();
                }
                catch (err) {
                    next(err);
                }
            }, async (req, res, next) => {
                try {
                    applicationDomain.updateConsultationHistory({
                        applicationId: req.ctx.applicationId,
                        ctx: req.ctx
                    });
                }
                catch (err) {
                    logger.error(`Cannot update applications consultation history: ${err}`);
                }
            }, async (err, req, res, next) => {
                var _a, _b;
                if (err instanceof ApplicationError_1.default && err.appEndpoint !== 'portal') {
                    res.redirect(`/${application_1.APPS_URL_PREFIX}/portal/?err=${err.type}&app=${err.appEndpoint}`);
                }
                else {
                    logger.error(`[${req.ctx.queryId}] ${err}`);
                    res.status((_a = err.statusCode) !== null && _a !== void 0 ? _a : 500).send((_b = err.type) !== null && _b !== void 0 ? _b : 'Internal server error');
                }
            });
            app.get('/', (req, res) => {
                res.redirect(`/${application_1.APPS_URL_PREFIX}/portal/`);
            });
        }
    };
}
exports.default = default_1;
