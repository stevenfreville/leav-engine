"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const filesManager_1 = require("../../../../_types/filesManager");
const handleCreateEvent_1 = require("./handleCreateEvent");
const handleMoveEvent_1 = require("./handleMoveEvent");
const handleRemoveEvent_1 = require("./handleRemoveEvent");
const handleUpdateEvent_1 = require("./handleUpdateEvent");
function default_1(deps) {
    const { 'core.domain.library': libraryDomain = null, 'core.domain.record': recordDomain = null, 'core.domain.value': valueDomain = null, 'core.domain.tree': treeDomain = null, 'core.domain.helpers.updateRecordLastModif': updateRecordLastModif = null, 'core.domain.record.helpers.sendRecordUpdateEvent': sendRecordUpdateEvent = null, 'core.infra.record': recordRepo = null, 'core.infra.amqpService': amqpService = null, 'core.infra.filesManager': filesManagerRepo = null, 'core.utils.logger': logger = null, 'core.utils': utils = null, config } = deps;
    return async (scanMsg, resources, ctx) => {
        const event = scanMsg.event;
        const helperDeps = {
            libraryDomain,
            recordDomain,
            valueDomain,
            treeDomain,
            recordRepo,
            filesManagerRepo,
            amqpService,
            updateRecordLastModif,
            sendRecordUpdateEvent,
            logger,
            config,
            utils
        };
        switch (event) {
            case filesManager_1.FileEvents.CREATE:
                await (0, handleCreateEvent_1.handleCreateEvent)(scanMsg, resources, helperDeps, ctx);
                break;
            case filesManager_1.FileEvents.REMOVE:
                await (0, handleRemoveEvent_1.handleRemoveEvent)(scanMsg, resources, helperDeps, ctx);
                break;
            case filesManager_1.FileEvents.UPDATE:
                await (0, handleUpdateEvent_1.handleUpdateEvent)(scanMsg, resources, helperDeps, ctx);
                break;
            case filesManager_1.FileEvents.MOVE:
                await (0, handleMoveEvent_1.handleMoveEvent)(scanMsg, resources, helperDeps, ctx);
                break;
            default:
                logger.warn(`[FilesManager] Event ${scanMsg.event} - Event not handle`);
        }
    };
}
exports.default = default_1;
