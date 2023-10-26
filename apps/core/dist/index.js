"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
const message_broker_1 = require("@leav/message-broker");
const fs_1 = __importDefault(require("fs"));
const minimist_1 = __importDefault(require("minimist"));
const config_1 = require("./config");
const depsManager_1 = require("./depsManager");
const i18nextInit_1 = __importDefault(require("./i18nextInit"));
const cache_1 = require("./infra/cache");
const db_1 = require("./infra/db/db");
const mailer_1 = require("./infra/mailer");
const pluginsLoader_1 = require("./pluginsLoader");
(async function () {
    const opt = (0, minimist_1.default)(process.argv.slice(2));
    let conf;
    try {
        conf = await (0, config_1.getConfig)();
        (0, config_1.validateConfig)(conf);
    }
    catch (e) {
        console.error('config error', e);
        process.exit(1);
    }
    // Init services
    const [translator, amqp, redisClient, mailer] = await Promise.all([
        (0, i18nextInit_1.default)(conf),
        (0, message_broker_1.amqpService)({
            config: Object.assign(Object.assign({}, conf.amqp), (opt.tasksManager === 'worker' && { prefetch: conf.tasksManager.workerPrefetch }))
        }),
        (0, cache_1.initRedis)({ config: conf }),
        (0, mailer_1.initMailer)({ config: conf }),
        (0, db_1.initDb)(conf)
    ]);
    const { coreContainer, pluginsContainer } = await (0, depsManager_1.initDI)({
        translator,
        'core.infra.amqpService': amqp,
        'core.infra.redis': redisClient,
        'core.infra.mailer': mailer
    });
    const server = coreContainer.cradle['core.interface.server'];
    const filesManager = coreContainer.cradle['core.interface.filesManager'];
    const indexationManager = coreContainer.cradle['core.interface.indexationManager'];
    const tasksManager = coreContainer.cradle['core.interface.tasksManager'];
    const dbUtils = coreContainer.cradle['core.infra.db.dbUtils'];
    const cli = coreContainer.cradle['core.interface.cli'];
    await (0, pluginsLoader_1.initPlugins)(coreContainer.cradle.pluginsFolder, pluginsContainer);
    const _createRequiredDirectories = async () => {
        if (!fs_1.default.existsSync('/files')) {
            await fs_1.default.promises.mkdir('/files');
        }
        if (!fs_1.default.existsSync(conf.preview.directory)) {
            await fs_1.default.promises.mkdir(conf.preview.directory);
        }
        if (!fs_1.default.existsSync(conf.export.directory)) {
            await fs_1.default.promises.mkdir(conf.export.directory);
        }
        if (!fs_1.default.existsSync(conf.import.directory)) {
            await fs_1.default.promises.mkdir(conf.import.directory);
        }
        if (!fs_1.default.existsSync(conf.diskCache.directory)) {
            await fs_1.default.promises.mkdir(conf.diskCache.directory);
        }
    };
    try {
        await _createRequiredDirectories();
        if (opt.server) {
            await server.init();
            await server.initConsumers();
        }
        else if (opt.migrate) {
            // Run db migrations
            await dbUtils.migrate(coreContainer);
            // Make sure we always exit process. Sometimes we don't and we're stuck here forever
            process.exit(0);
        }
        else if (opt.filesManager) {
            await filesManager.init();
        }
        else if (opt.indexationManager) {
            await indexationManager.init();
        }
        else if (opt.tasksManager === 'master') {
            await tasksManager.initMaster();
        }
        else if (opt.tasksManager === 'worker') {
            await tasksManager.initWorker();
        }
        else {
            await cli.run();
        }
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
})().catch(console.error);
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('exit', code => {
    console.info(`Exiting process ${process.pid} with code ${code}`);
});
