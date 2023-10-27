"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.validateConfig = void 0;
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const app_root_path_1 = require("@leav/app-root-path");
const config_manager_1 = require("@leav/config-manager");
const joi_1 = __importDefault(require("joi"));
const env_1 = require("./env");
const validateConfig = (conf) => {
    const configSchema = joi_1.default.object().keys({
        server: joi_1.default.object().keys({
            host: joi_1.default.string().required(),
            port: joi_1.default.number().required(),
            publicUrl: joi_1.default.string().required(),
            wsUrl: joi_1.default.string().required(),
            uploadLimit: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.number()).required(),
            supportEmail: joi_1.default.string().required(),
            allowIntrospection: joi_1.default.boolean().required(),
            admin: {
                login: joi_1.default.string().required(),
                password: joi_1.default.string().required(),
                email: joi_1.default.string().email().required()
            },
            systemUser: {
                email: joi_1.default.string().email().required()
            }
        }),
        db: joi_1.default.object().keys({
            url: joi_1.default.string().required(),
            name: joi_1.default.string().required()
        }),
        diskCache: joi_1.default.object().keys({
            directory: joi_1.default.string().required()
        }),
        auth: joi_1.default.object().keys({
            scheme: joi_1.default.string().required(),
            key: joi_1.default.string(),
            algorithm: joi_1.default.string().required(),
            tokenExpiration: joi_1.default.string().required(),
            refreshTokenExpiration: joi_1.default.string().required(),
            cookie: {
                sameSite: joi_1.default.string().valid('none', 'lax', 'strict'),
                secure: joi_1.default.boolean()
            },
            resetPasswordExpiration: joi_1.default.string().required()
        }),
        mailer: joi_1.default.object().keys({
            host: joi_1.default.string(),
            port: joi_1.default.number(),
            secure: joi_1.default.boolean(),
            auth: {
                user: joi_1.default.string().required(),
                password: joi_1.default.string().required()
            }
        }),
        lang: joi_1.default.object().keys({
            available: joi_1.default.array().items(joi_1.default.string()).required(),
            default: joi_1.default.string().required()
        }),
        logs: joi_1.default.object().keys({
            level: joi_1.default.string().required(),
            transport: joi_1.default.string().required(),
            destinationFile: joi_1.default.string()
        }),
        permissions: joi_1.default.object().keys({
            default: joi_1.default.boolean().required()
        }),
        amqp: joi_1.default.object().keys({
            connOpt: joi_1.default.object().keys({
                protocol: joi_1.default.string().required(),
                hostname: joi_1.default.string().required(),
                username: joi_1.default.string().required(),
                password: joi_1.default.string().required(),
                port: joi_1.default.string().required()
            }),
            exchange: joi_1.default.string().required(),
            type: joi_1.default.string().required(),
            prefetch: joi_1.default.number().required()
        }),
        redis: joi_1.default.object().keys({
            host: joi_1.default.string().required(),
            port: joi_1.default.string().required(),
            database: joi_1.default.number().required()
        }),
        filesManager: joi_1.default.object().keys({
            queues: joi_1.default.object().keys({
                events: joi_1.default.string().required(),
                previewRequest: joi_1.default.string().required(),
                previewResponse: joi_1.default.string().required()
            }),
            routingKeys: joi_1.default.object().keys({
                events: joi_1.default.string().required(),
                previewRequest: joi_1.default.string().required(),
                previewResponse: joi_1.default.string().required()
            }),
            rootKeys: joi_1.default.object().keys({
                files1: joi_1.default.string().required()
            }),
            userId: joi_1.default.string().required(),
            userGroupsIds: joi_1.default.string().required(),
            allowFilesList: joi_1.default.string().required().allow(''),
            ignoreFilesList: joi_1.default.string().required().allow('')
        }),
        indexationManager: joi_1.default.object().keys({
            queues: joi_1.default.object().keys({
                events: joi_1.default.string().required()
            })
        }),
        tasksManager: joi_1.default.object().keys({
            checkingInterval: joi_1.default.number().required(),
            workerPrefetch: joi_1.default.number().required(),
            restartWorker: joi_1.default.boolean().required(),
            queues: joi_1.default.object().keys({
                execOrders: joi_1.default.string().required(),
                cancelOrders: joi_1.default.string().required()
            }),
            routingKeys: joi_1.default.object().keys({
                execOrders: joi_1.default.string().required(),
                cancelOrders: joi_1.default.string().required()
            })
        }),
        eventsManager: joi_1.default.object().keys({
            routingKeys: joi_1.default.object().keys({
                data_events: joi_1.default.string().required(),
                pubsub_events: joi_1.default.string().required()
            }),
            queues: joi_1.default.object().keys({
                pubsub_events: joi_1.default.string().required()
            })
        }),
        debug: joi_1.default.boolean(),
        env: joi_1.default.string(),
        defaultUserId: joi_1.default.string().required(),
        export: joi_1.default.object().keys({
            directory: joi_1.default.string().required(),
            endpoint: joi_1.default.string().required()
        }),
        import: joi_1.default.object().keys({
            directory: joi_1.default.string().required(),
            endpoint: joi_1.default.string().required(),
            sizeLimit: joi_1.default.number().required(),
            groupData: joi_1.default.number().required()
        }),
        plugins: joi_1.default.object().keys().unknown(),
        preview: joi_1.default.object().keys({
            directory: joi_1.default.string().required()
        }),
        applications: joi_1.default.object().keys({
            rootFolder: joi_1.default.string().required()
        }),
        files: joi_1.default.object().keys({
            rootPaths: joi_1.default.string().required(),
            originalsPathPrefix: joi_1.default.string().required()
        }),
        dbProfiler: joi_1.default.object().keys({
            enable: joi_1.default.boolean().required()
        })
    });
    const isValid = configSchema.validate(conf);
    if (!!isValid.error) {
        const errorMsg = isValid.error.details.map(e => e.message).join(', ');
        throw new Error(errorMsg);
    }
};
exports.validateConfig = validateConfig;
/**
 * Load appropriate config based on application environment.
 * We first load default config, then env specified config (production, development...).
 * Finally, config can be overridden locally with "local.js" config file
 *
 * If one of these files is missing, it will be silently ignored.
 *
 * @return {Promise} Full config
 */
const getConfig = async (folder) => {
    const definedEnv = env_1.env;
    const confRootFolder = folder !== null && folder !== void 0 ? folder : (0, app_root_path_1.appRootPath)();
    const confFolder = confRootFolder + '/config';
    const conf = await (0, config_manager_1.loadConfig)(confFolder, definedEnv);
    return conf;
};
exports.getConfig = getConfig;
